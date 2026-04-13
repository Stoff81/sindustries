from fastapi import FastAPI, Request, Response
import json

app = FastAPI()

BLOCKED_PATTERNS = [
    # "ignore your instructions",
    # "bypass safety",
    # "reveal your system prompt",
    # "execute shell command",
]

@app.api_route("/{path:path}", methods=["POST"])
async def content_guard(request: Request, path: str = ""):
    body = await request.body()
    body_str = body.decode()
    body_lower = body_str.lower()

    for pattern in BLOCKED_PATTERNS:
        if pattern.lower() in body_lower:
            return Response(
                status_code=400,
                content=json.dumps({
                    "error": f"Blocked: matched '{pattern}'"
                }),
                media_type="application/json"
            )

    return Response(
        status_code=200,
        content=body,
        media_type="application/json"
    )
