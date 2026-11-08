# Song candidate spend (MiniMax plan, `mmx music`, model music-3.0)

- Track: storytime_l2_unit2_20261106, phase P1, task T1.13
- Role base: cc8867b4d93f0415e983be6696d21eee95fb9f74
- List price: 0.15 USD a track. Stop at 40 tracks = 6.00 USD.
- Plan use inside the MiniMax plan: 0 USD billed. The list price shows the value used.
- Quota read before each call: GET http://127.0.0.1:38307/api/quota/minimax-cn-coding-plan
  (`5h` and `weekly` used percent). Stop rule: `5h` 95 or more, or `weekly` 97 or more.
- Initial quota read (before the first call): `5h` 29 %, `weekly` 9 %.
- Last quota read (after the block): `5h` 30 %, `weekly` 9 %.

**Result: 0 tracks made. Spend at the list price: 0.00 USD. The provider closed the route.**

| # | Time (UTC) | Week | Cand | Take | Model | List USD | Sum USD | Quota before (5h/wk) | Result |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-08T22:21:05Z | w09 | c1 | t1 | music-3.0 | 0.15 | 0.00 | 30/9 | FAIL: HTTP 410 Music API closed for this account; no file, no charge |
| D1 | 2026-11-08T22:22Z | - | - | - | music-2.6-free | 0.00 | 0.00 | 30/9 | Diagnostic probe: same HTTP 410; no file, no charge |
| D2 | 2026-11-08T22:24Z | - | - | - | music-2.6-free, region global | 0.00 | 0.00 | 30/9 | Diagnostic probe: invalid api key (the cn key); no file, no charge |

Tracks made: 0. Spend at the list price: 0.00 USD.

## Exact error text of call 1

    {
      "error": {
        "code": 1,
        "message": "API error: This Music API is no longer available to new users. Existing paying customers can continue to use the service. For new access, please try MiniMax Audio (https://www.minimax.io/audio) or the open-source model at https://huggingface.co/MiniMaxAI/MiniMax-Music3 (HTTP 410)"
      }
    }

## Exact error text of the global probe

    {
      "error": {
        "code": 1,
        "message": "API error: invalid api key (HTTP 200)"
      }
    }

## Quota group check

`mmx quota show` lists two groups only: `general` and `video`. It lists no `music` group.
The MiniMax Coding Plan of this account holds no music quota.
