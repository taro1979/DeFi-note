#!/usr/bin/env python3
"""Generate an image with OpenAI's Image API.

Usage:
  python3 generate_with_gpt_image.py --prompt "editorial hero image"
  python3 generate_with_gpt_image.py --prompt "poster art" --size 1024x1536 --output ./out/poster.png
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path


API_URL = "https://api.openai.com/v1/images/generations"
MODEL_ALIASES = {
    "duct-tape-1": "gpt-image-1",
    "duct-tape-2": "gpt-image-1-mini",
    "duct-tape-3": "gpt-image-1.5",
    "maskingtape-alpha": "gpt-image-1.5",
}


def get_api_key() -> str:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY is not set.", file=sys.stderr)
        sys.exit(1)
    return api_key


def build_output_path(output: str | None, output_format: str) -> Path:
    if output:
        return Path(output)

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    return Path("generated") / f"gpt-image-{stamp}.{output_format}"


def request_image(
    prompt: str,
    model: str,
    quality: str,
    size: str,
    background: str,
    output_format: str,
) -> dict:
    api_key = get_api_key()
    resolved_model = MODEL_ALIASES.get(model, model)
    payload = {
        "model": resolved_model,
        "prompt": prompt,
        "size": size,
        "quality": quality,
        "background": background,
        "output_format": output_format,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=180) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"API Error {exc.code}: {body}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as exc:
        print(f"Network Error: {exc.reason}", file=sys.stderr)
        sys.exit(1)


def save_image(result: dict, output_path: Path) -> None:
    items = result.get("data", [])
    if not items:
        print("Error: image data was not returned.", file=sys.stderr)
        print(json.dumps(result, ensure_ascii=False, indent=2), file=sys.stderr)
        sys.exit(1)

    image_b64 = items[0].get("b64_json")
    if not image_b64:
        print("Error: b64_json was not found in response.", file=sys.stderr)
        print(json.dumps(result, ensure_ascii=False, indent=2), file=sys.stderr)
        sys.exit(1)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    image_bytes = base64.b64decode(image_b64)
    output_path.write_bytes(image_bytes)
    print(f"Saved image: {output_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate images with OpenAI GPT Image.")
    parser.add_argument("--prompt", required=True, help="Image prompt")
    parser.add_argument("--output", help="Output file path")
    parser.add_argument(
        "--model",
        default="duct-tape-3",
        help="Image model alias to send to the API",
    )
    parser.add_argument(
        "--quality",
        default="medium",
        choices=["low", "medium", "high", "auto"],
        help="Image quality",
    )
    parser.add_argument(
        "--size",
        default="1024x1024",
        choices=["1024x1024", "1536x1024", "1024x1536", "auto"],
        help="Image size",
    )
    parser.add_argument(
        "--background",
        default="auto",
        choices=["auto", "opaque", "transparent"],
        help="Background mode",
    )
    parser.add_argument(
        "--format",
        default="png",
        choices=["png", "jpeg", "webp"],
        help="Output format",
    )

    args = parser.parse_args()
    output_path = build_output_path(args.output, args.format)
    resolved_model = MODEL_ALIASES.get(args.model, args.model)
    if resolved_model != args.model:
        print(f"Resolved model alias: {args.model} -> {resolved_model}")
    result = request_image(
        prompt=args.prompt,
        model=args.model,
        quality=args.quality,
        size=args.size,
        background=args.background,
        output_format=args.format,
    )
    save_image(result, output_path)


if __name__ == "__main__":
    main()
