# Tiny LLM from Scratch

This is a small, inspectable next-token prediction experiment based on the recovered `simple_llm.py` source. It uses only Python's standard library. The embedding lookup, matrix multiplications, ReLU, softmax, cross-entropy, gradients, and parameter updates are written out explicitly; there is no PyTorch, TensorFlow, or other machine-learning framework.

## Run it

Install Python 3, then run:

```powershell
py -3 simple_llm.py
```

The script prints its initial `The` embedding and hidden state, the training loss and `P(quick)` after each pass through the eight examples, and a greedy generated sequence. The source currently uses fixed global parameters and starts training when run as a script.

## The experiment

The training sentence is:

> The quick brown fox jumps over the lazy dog

The program treats each adjacent pair as one training example. It learns eight transitions:

| Input token | Token ID | Expected next token | Token ID |
|---|---:|---|---:|
| The | 0 | quick | 1 |
| quick | 1 | brown | 2 |
| brown | 2 | fox | 3 |
| fox | 3 | jumps | 4 |
| jumps | 4 | over | 5 |
| over | 5 | the | 6 |
| the | 6 | lazy | 7 |
| lazy | 7 | dog | 8 |

The vocabulary has nine distinct, case-sensitive tokens. `The` and `the` are different tokens. Tokenization here is deliberately simple: the sentence is already split on spaces. Real language models need richer tokenizers to handle punctuation, word pieces, and unseen text.

## From token to probability

The input token ID selects one row of the embedding table. For `The`, the recovered specification gives this initial vector:

```text
embedding[0] = [0.278854, -0.949978, -0.449941, -0.553579]
```

An embedding is a learned list of numbers representing a token. This model has four numbers per token. The input-to-hidden matrix transforms that vector into four hidden pre-activation values:

```text
z = W_hidden × embedding + b_hidden
```

The hidden layer applies ReLU element by element:

```text
ReLU(x) = max(0, x)
```

Negative values become zero; positive values pass through. The recovered checkpoint for `The` is:

```text
hidden = [0.384029, 0, 0, 0.796667]
```

The output matrix maps the hidden vector to nine logits, one raw score per vocabulary token:

```text
logits = W_output × hidden + b_output
```

Logits are not probabilities. Softmax converts them into values between zero and one that sum to one:

```text
P(token i) = exp(logit[i] - max(logits))
             --------------------------------
             sum_j exp(logit[j] - max(logits))
```

Subtracting the largest logit is a numerical-stability step; it does not change the resulting probabilities. The recovered initial checkpoint says `P(quick) = 0.073655`, meaning the model assigns the correct next token about 7.37% probability before training.

## Loss and learning

For an example whose correct next token has probability `p`, cross-entropy loss is:

```text
loss = -ln(p)
```

If `p = 0.073655`, this one-example loss is about `2.60837`. Higher probability for the correct token means lower loss. The training code calculates this loss before updating the parameters for that example.

For softmax followed by cross-entropy, the gradient for each output logit is especially simple:

```text
dLoss/dLogit[i] = P(i) - target[i]
```

`target[i]` is 1 for the correct token (`quick`, ID 1, for input `The`) and 0 for the others. With `P(quick) = 0.157361`, the quick-logit gradient is `0.157361 - 1 = -0.842639`. A negative gradient tells gradient descent to raise the corresponding score, all else equal.

For an output weight, the gradient is:

```text
dLoss/dW_output[i,h] = dLoss/dLogit[i] × hidden[h]
```

Using the checkpoint's `hidden[3] = 0.796667`, the example gradient for the weight from hidden unit 3 to `quick` is approximately:

```text
-0.842639 × 0.796667 = -0.671303
```

Gradients then flow backward through the output matrix and ReLU to the hidden weights and the input token's embedding. ReLU's derivative is 1 for a positive pre-activation and 0 otherwise. The code applies gradient descent to each parameter:

```text
parameter = parameter - learning_rate × gradient
```

The learning rate is `0.1`. When the `The -> quick` example is processed, its embedding, network weights, and biases are adjusted using the loss gradients. Repeating that example makes the model more likely to predict `quick` after `The`, provided the updates continue to reduce its loss. Other examples also update the shared network weights, so training is not limited to that one association.

## Training loop and checkpoint timing

One displayed training step is one ordered pass over all eight examples. The implementation updates parameters immediately after each example (online/sequential updates), then displays the **mean of the eight losses measured before their respective updates**. After that pass, it runs a fresh forward pass for `The` and prints `P(quick)` using the updated parameters. This distinction matters: the displayed loss is an average over pre-update measurements, while the displayed probability is measured after the full pass.

The recovered checkpoint notes these values:

| Checkpoint | Reported value | Interpretation / verification status |
|---|---:|---|
| Initial `The` embedding | `[0.278854, -0.949978, -0.449941, -0.553579]` | Supplied in the specification; not yet run locally |
| Initial hidden state for `The` | `[0.384029, 0, 0, 0.796667]` | Supplied; not yet run locally |
| Step 1 loss | `2.608369` | Supplied; appears to be the initial single-example loss, not this source's eight-example mean |
| Step 1 `P(quick)` | `0.073655` | Supplied as an initial probability; source prints probability after its first full pass for Step 1 |
| Step 12 `P(quick)` | `0.157361` | Supplied; not locally verified |
| Step 13 quick-logit gradient | `-0.842639` | Algebraically follows from `P(quick)=0.157361` for the `The -> quick` example |
| Step 14 output-weight gradient `w1,3` | `-0.671303` | Algebraically follows from that logit gradient and hidden value `0.796667` |
| Step 12 example loss | `1.849212` | Equals `-ln(0.157361)` to the shown precision; that is a per-example loss |
| Step 20 loss | `0.549986` | Supplied; meaning (per-example or eight-example mean) needs confirmation |
| Step 20 `P(quick)` | `0.576958` | Supplied; not locally verified |

The Step 1 figures expose a real reporting ambiguity in the recovered source. Since `-ln(0.073655) ≈ 2.608369`, that loss belongs to the initial `The -> quick` example. But `train()` prints the average loss over all eight examples in Step 1, after processing those examples sequentially. Also, the Step 1 probability it prints is measured **after** that pass, not at initialization. The recovered checkpoint notes therefore do not have the same measurement definitions as the current print statements, unless they came from a different revision. Nothing in this project changes the algorithm merely to force those values to match.

## What this model can and cannot show

This project can show how token IDs select embeddings, how matrix multiplication and ReLU create hidden activations, how logits become probabilities, how cross-entropy creates gradients, and how gradient descent changes parameters. Its tiny dimensions and printed intermediate vectors are intentional: you can trace the path from token to update using individual numbers.

It is not a capable general-purpose language model. The training data is one sentence, the context is only the current token, and the model has no attention, transformer blocks, broad vocabulary, or meaningful factual knowledge. Its generated sequence is a demonstration of next-token selection, not evidence of language understanding.

See [PROJECT_STATE.md](PROJECT_STATE.md) for the recovery record, current verification status, discrepancies, and follow-up work.
