#!/usr/bin/env python3
"""Nano Banana (Gemini) Image Generation Script.

Usage:
  python3 generate_image.py --prompt "prompt" --output "output.png"
  python3 generate_image.py --prompt "edit instruction" --input "source.png" --output "output.png"
"""

import argparse
import base64
import json
import os
import sys
import urllib.request
import urllib.error


MODELS = {
    "flash": "gemini-3.1-flash-image-preview",
    "pro": "gemini-3-pro-image-preview",
}

API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


def get_api_key():
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        print("Error: GEMINI_API_KEY or GOOGLE_API_KEY not set", file=sys.stderr)
        sys.exit(1)
    return key


def encode_image(path):
    with open(path, "rb") as f:
        data = f.read()
    ext = path.lower().rsplit(".", 1)[-1]
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp"}.get(ext, "image/png")
    return base64.b64encode(data).decode(), mime


def build_request(prompt, input_path=None, aspect="16:9", resolution="2K"):
    parts = []
    if input_path:
        img_data, mime = encode_image(input_path)
        parts.append({"inline_data": {"mime_type": mime, "data": img_data}})

    parts.append({"text": prompt})

    return {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
            "imageConfig": {
                "aspectRatio": aspect,
                "imageSize": resolution,
            },
        },
    }


def generate(prompt, output, input_path=None, aspect="16:9", resolution="2K", model="flash"):
    api_key = get_api_key()
    model_id = MODELS.get(model, MODELS["flash"])
    url = f"{API_BASE}/{model_id}:generateContent?key={api_key}"

    payload = build_request(prompt, input_path, aspect, resolution)
    data = json.dumps(payload).encode()

    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"API Error {e.code}: {body}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"Network Error: {e.reason}", file=sys.stderr)
        sys.exit(1)

    # Extract image from response
    candidates = result.get("candidates", [])
    if not candidates:
        print("Error: No candidates in response", file=sys.stderr)
        print(json.dumps(result, indent=2), file=sys.stderr)
        sys.exit(1)

    parts = candidates[0].get("content", {}).get("parts", [])

    image_saved = False
    text_response = []

    for part in parts:
        if "inline_data" in part:
            img_bytes = base64.b64decode(part["inline_data"]["data"])
            os.makedirs(os.path.dirname(output) or ".", exist_ok=True)
            with open(output, "wb") as f:
                f.write(img_bytes)
            image_saved = True
            print(f"Image saved: {output} ({len(img_bytes)} bytes)")
        elif "text" in part:
            text_response.append(part["text"])

    if text_response:
        print(f"Model response: {' '.join(text_response)}")

    if not image_saved:
        print("Warning: No image data in response", file=sys.stderr)
        print(json.dumps(result, indent=2, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Nano Banana Image Generation")
    parser.add_argument("--prompt", required=True, help="Generation or edit prompt")
    parser.add_argument("--output", default="./generated_image.png", help="Output file path")
    parser.add_argument("--input", default=None, help="Input image for editing (optional)")
    parser.add_argument("--aspect", default="16:9", help="Aspect ratio (e.g., 16:9, 1:1, 9:16)")
    parser.add_argument("--resolution", default="2K", help="Resolution (512, 1K, 2K, 4K)")
    parser.add_argument("--model", default="pro", choices=["flash", "pro"], help="Model to use (default: pro for quality)")

    args = parser.parse_args()
    generate(args.prompt, args.output, args.input, args.aspect, args.resolution, args.model)


if __name__ == "__main__":
    main()
