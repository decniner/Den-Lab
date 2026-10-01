# Project State: Tiny LLM from Scratch

## Preservation status

- The recovered attachment `tiny_llm_from_scratch.py.txt` was copied to `simple_llm.py` without changing its source text.
- This is a reconstruction from prior work. Byte-for-byte identity with an earlier original has not been established.
- No unrelated project files were changed for this project.

## Current implementation

`simple_llm.py` implements a one-token-to-next-token neural network for the eight adjacent pairs in `The quick brown fox jumps over the lazy dog`. It uses Python's standard-library `math` and `random` modules only. A fixed `random.seed(42)` initializes embeddings and weights; biases start at zero.

Architecture and dimensions:

```text
token ID (9 possible)
  -> embedding lookup (9 × 4 table)
  -> hidden linear transform (4 units)
  -> ReLU
  -> output linear transform (9 logits)
  -> softmax (9 probabilities)
  -> cross-entropy against next-token ID
  -> explicit gradients and gradient-descent update (learning rate 0.1)
```

The loop visits examples in listed order, one at a time. It calculates each example's loss and gradients from current parameters and then immediately updates the output weights, hidden weights, biases, and embedding row for the input token. The printed step loss is the mean of those eight pre-update example losses. The printed `P(quick)` is a new forward-pass probability after the eight updates have completed.

## Known checkpoints from the supplied specification

These are recorded as **reported checkpoints**, not claims that this recovery has reproduced them:

| Point | Reported checkpoint |
|---|---|
| Initial embedding for `The` | `[0.278854, -0.949978, -0.449941, -0.553579]` |
| Initial hidden state for `The` | `[0.384029, 0, 0, 0.796667]` |
| Step 1 | loss `2.608369`; `P(quick) = 0.073655` |
| Step 12 | `P(quick) = 0.157361` |
| Step 13 | quick output-logit gradient `-0.842639` |
| Step 14 | example output-weight gradient `w1,3 = -0.671303` |
| Step 20 | loss `0.549986`; `P(quick) = 0.576958` |

Two checkpoint relationships are internally consistent to the displayed precision:

```text
0.157361 - 1 = -0.842639
-0.842639 × 0.796667 ≈ -0.671303
```

Also, `-ln(0.073655) ≈ 2.608369`. This means the Step 1 loss is consistent with the initial loss for the first example `The -> quick`. It is not necessarily consistent with the source's Step 1 printed loss, which is an average over all eight ordered examples.

## Verification results

**Execution is blocked on this computer:** the `py` launcher is present, but `py -0p` reports no installed Python runtime. Running the recovered `.py.txt` with `py -3` returned `No installed Python found!`. Therefore the implementation's numeric output and all checkpoints remain unverified here. No installation was attempted and no source edits were made to chase the checkpoint values.

The following static observations were made directly from the recovered source:

- The seed is 42; initialization order is embeddings, hidden weights, then output weights, all row-major list comprehensions using `random.uniform(-1, 1)`.
- The eight examples run in sentence order.
- Updates happen after each individual example, not after a batch.
- ReLU is `max(0.0, x)` and its derivative is 1 for positive pre-activation, else 0.
- Softmax subtracts the maximum logit before exponentiation.
- Loss is `-log(max(correct_probability, 1e-12))`.
- The softmax/cross-entropy logit gradient is `probability - one_hot_target`.
- Gradients are calculated from the pre-update forward-pass cache and applied with learning rate 0.1.
- The loss is captured before that example's update; the printed `P(quick)` is obtained after the full pass.
- The source prints average loss and probability, but does not print the specified Step 13/14 gradients explicitly.

## Discrepancies and uncertainties

1. **Step 1 loss definition:** the recovered code prints the eight-example average, but `2.608369` is the single-example loss implied by initial `P(quick) = 0.073655`. Check whether the original checkpoint meant the first-example loss or came from another code revision.
2. **Step 1 probability timing:** this code prints `P(quick)` after all eight Step 1 updates. The stated `0.073655` matches the supplied initial state and should not be assumed to be the value printed as Step 1 by this code.
3. **Step 12/13/14 indexing:** the reported gradient values are algebraically connected, but the notes do not say whether a “step” means a full pass, an example update, or an inspection performed before/after an update. The source's full-pass meaning may differ.
4. **Step 20 loss meaning:** the checkpoint does not identify whether `0.549986` is the average across eight examples or one example's loss.
5. **Numerical reproduction:** Python's exact random sequence and all update math have not been executed in this environment due to the missing runtime.

These points are documented rather than repaired by changing the learning algorithm or moving the measurement points.

## What remains to be explored

- Install or otherwise provide Python 3, then run `py -3 simple_llm.py` and capture the complete output.
- Compare the actual initial embedding, hidden values, Step 1 and Step 20 summaries with the supplied checkpoints.
- If they differ, isolate the first divergence by inspecting initialization, per-example pre-update loss, gradients, and parameter updates; preserve this recovered implementation before experimenting with alternate interpretations.
- Add optional diagnostic output for a selected example and step only after keeping the baseline run and measurements reproducible.
- Decide and document whether checkpoints count full passes or individual examples, and whether a named loss is per example or an eight-example average.

## How to run

From this directory, with Python 3 installed:

```powershell
py -3 simple_llm.py
```

The program trains 20 full passes by default and prints its trace. The educational explanations and equations are in [README.md](README.md).
