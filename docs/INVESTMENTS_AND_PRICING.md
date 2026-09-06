# Investments and Pricing

Milestone 8 separates portfolio calculation, market-data orchestration, and provider adapters. Holdings and lots preserve exact decimal quantities and integer-paise cost basis independently from price observations. Current value, realised gain, and unrealised gain are derived without mutating historical cost.

Provider adapters return timestamped quotes through a narrow interface. A failed, unavailable, rate-limited, or offline provider leaves holdings and cached valuations unchanged. Manual valuations remain fully functional without an API. Fixed deposits and retirement assets use book/manual values without requiring live pricing, and mutual-fund observations are represented as dated valuations rather than continuous quotes.

The Wealth route exposes portfolio totals, lot entry, price source, timestamps, cached/offline state, and manual refresh. Provider configuration stays local; no API keys are committed to source.
