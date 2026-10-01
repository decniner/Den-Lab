# Tiny LLM from Scratch
# Educational implementation: next-token prediction for
# "The quick brown fox jumps over the lazy dog"
#
# Architecture:
#   token -> embedding -> hidden layer (ReLU) -> logits -> softmax
#
# No PyTorch/TensorFlow. The math is implemented directly so the
# forward pass, loss, gradients, and parameter updates are visible.

import math
import random

# ============================================================
# 1. DATA AND TOKENIZATION
# ============================================================

TEXT = "The quick brown fox jumps over the lazy dog"

tokens = ["The", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog"]

token_to_id = {token: i for i, token in enumerate(tokens)}
id_to_token = {i: token for token, i in token_to_id.items()}

# Eight training examples:
# input token -> next token
training_examples = [
    (0, 1),  # The -> quick
    (1, 2),  # quick -> brown
    (2, 3),  # brown -> fox
    (3, 4),  # fox -> jumps
    (4, 5),  # jumps -> over
    (5, 6),  # over -> the
    (6, 7),  # the -> lazy
    (7, 8),  # lazy -> dog
]

VOCAB_SIZE = 9
EMBEDDING_SIZE = 4
HIDDEN_SIZE = 4
LEARNING_RATE = 0.1

# ============================================================
# 2. MODEL PARAMETERS
# ============================================================

# A deterministic seed makes the experiment reproducible.
random.seed(42)

# Embedding table:
# 9 tokens x 4 numbers.
#
# Each token ID points to one row.
embeddings = [
    [random.uniform(-1, 1) for _ in range(EMBEDDING_SIZE)]
    for _ in range(VOCAB_SIZE)
]

# Input -> hidden weights
W_hidden = [
    [random.uniform(-1, 1) for _ in range(EMBEDDING_SIZE)]
    for _ in range(HIDDEN_SIZE)
]

b_hidden = [0.0 for _ in range(HIDDEN_SIZE)]

# Hidden -> output weights
W_output = [
    [random.uniform(-1, 1) for _ in range(HIDDEN_SIZE)]
    for _ in range(VOCAB_SIZE)
]

b_output = [0.0 for _ in range(VOCAB_SIZE)]


# ============================================================
# 3. BASIC MATH
# ============================================================

def relu(x):
    """ReLU keeps positive values and changes negative values to 0."""
    return max(0.0, x)


def relu_derivative(x):
    """Derivative of ReLU used during backpropagation."""
    return 1.0 if x > 0 else 0.0


def softmax(logits):
    """
    Convert arbitrary output scores (logits) into probabilities.

    Subtracting max(logits) prevents very large exponentials from
    overflowing numerically.
    """
    maximum = max(logits)
    exponentials = [math.exp(x - maximum) for x in logits]
    total = sum(exponentials)
    return [x / total for x in exponentials]


def cross_entropy_loss(probabilities, target_id):
    """
    Cross-entropy loss for one training example.

    If the model gives the correct token a high probability,
    loss is small. If probability is tiny, loss is large.
    """
    probability = max(probabilities[target_id], 1e-12)
    return -math.log(probability)


# ============================================================
# 4. FORWARD PASS
# ============================================================

def forward(input_id):
    """
    Predict the next token.

    Returns all intermediate values because this is an educational
    model and hiding the machinery would defeat the point.
    """

    # Look up the input token's embedding.
    embedding = embeddings[input_id]

    # Linear transformation into the hidden layer.
    hidden_pre_activation = []

    for h in range(HIDDEN_SIZE):
        value = b_hidden[h]

        for e in range(EMBEDDING_SIZE):
            value += W_hidden[h][e] * embedding[e]

        hidden_pre_activation.append(value)

    # ReLU activation.
    hidden = [
        relu(x)
        for x in hidden_pre_activation
    ]

    # Hidden layer -> output logits.
    logits = []

    for output_id in range(VOCAB_SIZE):
        value = b_output[output_id]

        for h in range(HIDDEN_SIZE):
            value += W_output[output_id][h] * hidden[h]

        logits.append(value)

    # Logits -> probabilities.
    probabilities = softmax(logits)

    return {
        "embedding": embedding,
        "hidden_pre_activation": hidden_pre_activation,
        "hidden": hidden,
        "logits": logits,
        "probabilities": probabilities,
    }


# ============================================================
# 5. BACKWARD PASS
# ============================================================

def backward(input_id, target_id, cache):
    """
    Calculate gradients for one training example.

    The key idea:

        prediction
            |
          loss
            |
        gradients
            |
       parameter updates

    A gradient tells us which direction a parameter should move
    to reduce the error.
    """

    embedding = cache["embedding"]
    hidden_pre = cache["hidden_pre_activation"]
    hidden = cache["hidden"]
    probabilities = cache["probabilities"]

    # --------------------------------------------------------
    # Output layer gradient
    # --------------------------------------------------------
    #
    # For softmax + cross entropy:
    #
    # dLoss/dLogit = probability - target
    #
    # The target probability is treated as 1.
    # Every other target is treated as 0.
    d_logits = probabilities.copy()
    d_logits[target_id] -= 1.0

    # Hidden -> output gradients.
    d_W_output = [
        [0.0 for _ in range(HIDDEN_SIZE)]
        for _ in range(VOCAB_SIZE)
    ]

    d_b_output = [0.0 for _ in range(VOCAB_SIZE)]

    for output_id in range(VOCAB_SIZE):
        d_b_output[output_id] = d_logits[output_id]

        for h in range(HIDDEN_SIZE):
            d_W_output[output_id][h] = (
                d_logits[output_id] * hidden[h]
            )

    # --------------------------------------------------------
    # Gradient flowing backward into hidden layer
    # --------------------------------------------------------

    d_hidden = [0.0 for _ in range(HIDDEN_SIZE)]

    for h in range(HIDDEN_SIZE):
        for output_id in range(VOCAB_SIZE):
            d_hidden[h] += (
                W_output[output_id][h] *
                d_logits[output_id]
            )

    # ReLU derivative.
    d_hidden_pre = [
        d_hidden[h] * relu_derivative(hidden_pre[h])
        for h in range(HIDDEN_SIZE)
    ]

    # --------------------------------------------------------
    # Hidden input gradients
    # --------------------------------------------------------

    d_W_hidden = [
        [0.0 for _ in range(EMBEDDING_SIZE)]
        for _ in range(HIDDEN_SIZE)
    ]

    d_b_hidden = [0.0 for _ in range(HIDDEN_SIZE)]

    d_embedding = [0.0 for _ in range(EMBEDDING_SIZE)]

    for h in range(HIDDEN_SIZE):
        d_b_hidden[h] = d_hidden_pre[h]

        for e in range(EMBEDDING_SIZE):
            d_W_hidden[h][e] = (
                d_hidden_pre[h] * embedding[e]
            )

            d_embedding[e] += (
                W_hidden[h][e] *
                d_hidden_pre[h]
            )

    return {
        "d_logits": d_logits,
        "d_W_output": d_W_output,
        "d_b_output": d_b_output,
        "d_hidden": d_hidden,
        "d_hidden_pre": d_hidden_pre,
        "d_W_hidden": d_W_hidden,
        "d_b_hidden": d_b_hidden,
        "d_embedding": d_embedding,
    }


# ============================================================
# 6. PARAMETER UPDATE
# ============================================================

def update_parameters(input_id, gradients):
    """
    Gradient descent update:

        parameter = parameter - learning_rate * gradient

    If a gradient is negative, the parameter increases.
    If a gradient is positive, the parameter decreases.
    """

    d = gradients

    # Update the output layer.
    for output_id in range(VOCAB_SIZE):
        for h in range(HIDDEN_SIZE):
            W_output[output_id][h] -= (
                LEARNING_RATE *
                d["d_W_output"][output_id][h]
            )

        b_output[output_id] -= (
            LEARNING_RATE *
            d["d_b_output"][output_id]
        )

    # Update the hidden layer.
    for h in range(HIDDEN_SIZE):
        for e in range(EMBEDDING_SIZE):
            W_hidden[h][e] -= (
                LEARNING_RATE *
                d["d_W_hidden"][h][e]
            )

        b_hidden[h] -= (
            LEARNING_RATE *
            d["d_b_hidden"][h]
        )

    # Update the embedding belonging to the current input token.
    for e in range(EMBEDDING_SIZE):
        embeddings[input_id][e] -= (
            LEARNING_RATE *
            d["d_embedding"][e]
        )


# ============================================================
# 7. DISPLAY HELPERS
# ============================================================

def print_vector(name, values, precision=6):
    formatted = ", ".join(
        f"{x:.{precision}f}"
        for x in values
    )
    print(f"{name}: [{formatted}]")


def print_prediction(probabilities, target_id):
    ranked = sorted(
        enumerate(probabilities),
        key=lambda x: x[1],
        reverse=True
    )

    print("Prediction:")
    for token_id, probability in ranked:
        marker = " <-- TARGET" if token_id == target_id else ""
        print(
            f"  {id_to_token[token_id]:>5} "
            f"{probability:.6f}{marker}"
        )


# ============================================================
# 8. TRAINING
# ============================================================

def train(steps=20, verbose=True):
    print("=" * 70)
    print("TINY LLM FROM SCRATCH")
    print("=" * 70)
    print()
    print("Training text:")
    print(f'  "{TEXT}"')
    print()
    print("Architecture:")
    print("  Token -> Embedding -> Hidden/ReLU -> Logits -> Softmax")
    print()
    print(f"Vocabulary size : {VOCAB_SIZE}")
    print(f"Embedding size  : {EMBEDDING_SIZE}")
    print(f"Hidden size     : {HIDDEN_SIZE}")
    print(f"Learning rate   : {LEARNING_RATE}")
    print()
    print("=" * 70)

    for step in range(1, steps + 1):

        total_loss = 0.0

        # Train on all eight input -> next-token examples.
        for input_id, target_id in training_examples:

            cache = forward(input_id)

            loss = cross_entropy_loss(
                cache["probabilities"],
                target_id
            )

            gradients = backward(
                input_id,
                target_id,
                cache
            )

            total_loss += loss

            update_parameters(
                input_id,
                gradients
            )

        average_loss = total_loss / len(training_examples)

        # Examine the first training example: The -> quick.
        first_cache = forward(0)
        quick_probability = first_cache["probabilities"][1]

        if verbose:
            print()
            print(
                f"Step {step:02d} | "
                f"Loss {average_loss:.6f} | "
                f"P(quick) {quick_probability:.6f}"
            )

            if step == 1 or step == steps:
                print_prediction(
                    first_cache["probabilities"],
                    target_id=1
                )

    print()
    print("=" * 70)
    print("TRAINING COMPLETE")
    print("=" * 70)


# ============================================================
# 9. GENERATION
# ============================================================

def generate(start_token="The", max_tokens=9):
    """
    Generate tokens one at a time.

    This is not a large language model. It is a tiny demonstration
    of the same basic idea: predict the next token from the current
    context.
    """

    if start_token not in token_to_id:
        raise ValueError(
            f"Unknown token: {start_token}"
        )

    current_id = token_to_id[start_token]
    generated = [start_token]

    for _ in range(max_tokens - 1):
        cache = forward(current_id)
        probabilities = cache["probabilities"]

        # Greedy generation: choose the highest-probability token.
        next_id = max(
            range(VOCAB_SIZE),
            key=lambda i: probabilities[i]
        )

        generated.append(id_to_token[next_id])
        current_id = next_id

    return " ".join(generated)


# ============================================================
# 10. MAIN
# ============================================================

if __name__ == "__main__":

    # Show the initial embedding for "The".
    print()
    print("Initial parameter inspection")
    print("-" * 70)
    print_vector(
        'Embedding for "The"',
        embeddings[token_to_id["The"]]
    )

    initial = forward(token_to_id["The"])

    print_vector(
        'Hidden state for "The"',
        initial["hidden"]
    )

    print()

    # Train.
    train(steps=20, verbose=True)

    # Generate after training.
    print()
    print("Generated sequence:")
    print("  " + generate("The"))
