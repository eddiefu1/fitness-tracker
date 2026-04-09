"""
Local OpenAI-compatible chat server for Qwen (transformers).
Matches the Hugging Face usage pattern for Qwen/Qwen3-30B-A3B-Instruct-2507.

Run (after pip install -r requirements.txt):
  set LLM_MODEL_ID=Qwen/Qwen3-30B-A3B-Instruct-2507
  uvicorn server:app --host 127.0.0.1 --port 8765

Requires sufficient GPU memory for the chosen checkpoint (30B is large; use a
smaller LLM_MODEL_ID for CPU/smaller GPUs).
"""
from __future__ import annotations

import asyncio
import os
from typing import Any

import torch
from fastapi import FastAPI
from pydantic import BaseModel, Field
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL_ID = os.environ.get("LLM_MODEL_ID", "Qwen/Qwen3-30B-A3B-Instruct-2507")
HF_TOKEN = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_HUB_TOKEN")

tokenizer: Any = None
model: Any = None
_lock = asyncio.Lock()

app = FastAPI(title="Local Qwen chat")


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    model: str = ""
    messages: list[ChatMessage] = Field(default_factory=list)
    max_tokens: int = 1024


class ChatCompletionResponse(BaseModel):
    choices: list[dict[str, Any]]


def _load_model() -> None:
    global tokenizer, model
    if tokenizer is not None:
        return

    kwargs: dict[str, Any] = {
        "trust_remote_code": True,
        "token": HF_TOKEN or None,
    }
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, **kwargs)

    dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32
    load_kw: dict[str, Any] = {
        "torch_dtype": dtype,
        "trust_remote_code": True,
        "token": HF_TOKEN or None,
    }
    if torch.cuda.is_available():
        load_kw["device_map"] = "auto"
    model = AutoModelForCausalLM.from_pretrained(MODEL_ID, **load_kw)
    if not torch.cuda.is_available():
        model = model.to("cpu")


def _generate_sync(messages: list[dict[str, str]], max_new_tokens: int) -> str:
    _load_model()
    assert tokenizer is not None and model is not None

    inputs = tokenizer.apply_chat_template(
        messages,
        add_generation_prompt=True,
        tokenize=True,
        return_dict=True,
        return_tensors="pt",
    )
    device = next(model.parameters()).device
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
        )

    prompt_len = inputs["input_ids"].shape[-1]
    text = tokenizer.decode(outputs[0][prompt_len:], skip_special_tokens=True)
    return text.strip()


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "model": MODEL_ID}


@app.post("/v1/chat/completions", response_model=ChatCompletionResponse)
async def chat_completions(body: ChatCompletionRequest) -> ChatCompletionResponse:
    msgs = [{"role": m.role, "content": m.content} for m in body.messages]
    if not msgs:
        return ChatCompletionResponse(choices=[{"message": {"role": "assistant", "content": ""}}])

    max_new = min(max(body.max_tokens, 1), 4096)

    async with _lock:
        loop = asyncio.get_running_loop()
        text = await loop.run_in_executor(
            None, lambda: _generate_sync(msgs, max_new_tokens=max_new)
        )

    return ChatCompletionResponse(
        choices=[{"message": {"role": "assistant", "content": text}}]
    )
