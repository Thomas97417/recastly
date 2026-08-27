FROM oven/bun:1.3.0-debian

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg python3-pip \
  && pip3 install --break-system-packages --no-cache-dir streamlink \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
WORKDIR /app/apps/worker

VOLUME ["/data"]
CMD ["bun", "src/index.ts"]
