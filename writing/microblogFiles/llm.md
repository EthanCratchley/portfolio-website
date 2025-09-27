**Objective:** Build a simple transformer-based language model that can generate text or predict the next word in a sequence.

**Scale:** 2-3M Parameters

**Dataset:** NeelNanda/pile-10k (~9.5M Tokens)

**Libraries:**
- PyTorch: Building and training the model
- Datasets: Easy sample dataset access
- NumPy: Math

## Introduction
In this workbook I will be working on building, designing,and training a small scale LLM from scratch. My hope with this project is to get a better understanding of how things work, in turn allowing me to better work with and on AI.

## Step 1: Set Up Environment
```sh
!pip install torch datasets
```

```py
# Import Dependencies
from datasets import load_dataset
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import re
from collections import Counter
```

## Step 2: Gather and Pepare a Dataset

In this step we are simply retrieving a dataset to train our model on and doing some super basic data cleaning.

We will be using the `NeelNanda/pile-10k` dataset which is hosted on Hugging Face and is curated by Neel Nada, an AI researcher. It's a small subset of **The Pile** which is a massive 825GB dataset created by EleutherAI. Given that we are working on a smaller scale LLM this subset should do the trick

This dataset contains about 10,000 examples (10-50 MB) of raw text. This is tiny compared to The Pile and other datasets used by major labs.

**Content:**
- Public domain books (BookCorupus)
- Wikipedia Articles
- GitHub Code
- Web Text
- Scientific Papers
- Much more

```py
dataset = load_dataset("NeelNanda/pile-10k", split="train")

# Extract text
text_data = [example["text"] for example in dataset]

# Save to a file
with open("minipile.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(text_data))

# Basic cleaning
with open("minipile.txt", "r", encoding="utf-8") as f:
    text = f.read()
text = " ".join(text.split())

# Load Dataset
with open("minipile_cleaned.txt", "w", encoding="utf-8") as f:
    f.write(text)

# Verify Characters
print(f"Dataset size: {len(text)} characters")
```

## Step 3: Implement Tokenizer

A tokenizer turns text into numbers your model can process. It's like a dictionary where words get IDs based on how common they are. This is the first step in converting `pile-10k` into the correct format for training.

**Tokenizer:**
- Input: A string
- Output: A list of numbers where each number is a word's ID plus an end token (`<EOS>`)

Your tokenizer will need to splut text into words, build a vocabulary (count words, assign IDs) and hnadle unknown words with `<UNK>`.

*NOTE: Modern LLMs tokenize words at about a ~1:.75 ratio (1 token = .75 words)to better handle huge vocabluaries and rare words. This allows for better generalization and is known as a "subword tokenizer". The tokenizer we are building is a simple word-level tokenizer with a 1:1 ratio.*

```py
# Tokenizer Class
class BasicTokenizer:
  def __init__(self):
    self.vocab = {} # word -> id
    self.inverse_vocab = {} # id -> word
    self.max_vocab_size = 10_000 # Cap vocab size to keep it manageable

  # Building a vocab from text
  def train(self, text):
    # Split text into words
    words = re.split(r'\s+|[.,!?;:"\'()]+', text.lower())
    words = [w for w in words if w]

    # Count word frequencies and limit vocab
    word_counts = Counter(words).most_common(self.max_vocab_size - 2) # reserving two spots for special tokens (<UNK> & <EOS)
    vocab_size = len(word_counts)

    # Build vocab
    self.vocab = {"<UNK>": 0, "<EOS>": 1}
    for i, (word, _) in enumerate(word_counts, start = 2):
      self.vocab[word] = i

    # Inverse vocab for decoding
    self.inverse_vocab = {v: k for k, v in self.vocab.items()}
    print(f"Vocab Size: {len(self.vocab)}")

  # Text -> Numbers
  def encode(self, text):
    # Split text and convert to token IDs
    words = re.split(r'\s+|[.,!?;:"\'()]+', text.lower())
    token_ids = [self.vocab.get(word, self.vocab["<UNK>"]) for word in words if word]
    token_ids.append(self.vocab["<EOS>"])
    return token_ids

  # Numbers -> Text
  def decode(self, token_ids):
    # Convert token IDs back to text
    words = [self.inverse_vocab.get(id, "<UNK>") for id in token_ids]
    return " ".join(words)

# Train the tokenizer
tokenizer = BasicTokenizer()
tokenizer.train(text)
print("Sample Vocab:", list(tokenizer.vocab.items())[:10])

# Test tokenizer
sample_text = "Hello world! This is a test."
encoded = tokenizer.encode(sample_text)
decoded = tokenizer.decode(encoded)
print(f"Original: {sample_text}")
print(f"Encoded: {encoded}")
print(f"Decoded: {decoded}")
```

## Step 4: Model Architecture

Like most modern LLMs the best place to start is a transformer based model. Transformers can get complex fast so we will be building a **decoder-only transformer** (a minimal version compared to modern LLMs but still the same architecture) with a single layer.

**Components:**
- Embedding layer: Turns token IDs into dense vectors
- Attention Mechanism: Lets the model focus on relevant tokens in the sequence
- Feedforward Layer: adds the processing power
- Output Layer: Predicts the next token

```py
class SimpleTransformer(nn.Module):
  def __init__(self, vocab_size, embed_size, n_heads, hidden_size):
    super(SimpleTransformer, self).__init__()

    # Embedding Layer: turns token IDs into dense vectors
    self.embedding = nn.Embedding(vocab_size, embed_size)

    # Multi-head attention: lets the model focus on previous tokens
    self.attention = nn.MultiheadAttention(embed_size, n_heads)

    # Feedforward Layer: adds some preprocessing power
    self.feedforward = nn .Sequential(
        nn.Linear(embed_size, hidden_size),
        nn.ReLU(),
        nn.Linear(hidden_size, embed_size)
    )

    # Output layer: predicts next token across vocab
    self.output = nn.Linear(embed_size, vocab_size)

    # Layer norm for stability
    self.norm1 = nn.LayerNorm(embed_size)
    self.norm2 = nn.LayerNorm(embed_size)

  def forward(self, x):
    # x shape: batch_size, sequence_length

    # Embed Tokens: (batch_size, seq_len) -> (batch_size, seq_len, embed_size)
    x = self.embedding(x)

    # Attention expects (seq_len, batch_size, embed_size), so transpose
    x = x.transpose(0, 1)  # (seq_len, batch_size, embed_size)
    attn_output, _ = self.attention(x, x, x)  # Self-attention
    x = self.norm1(x + attn_output)  # Add & norm (residual connection)

    # Feedforward: apply to each position
    ff_output = self.feedforward(x.transpose(0, 1)).transpose(0, 1)
    x = self.norm2(x + ff_output)

    # back to (batch_size, seq_len, embed_size)
    x = x.transpose(0, 1)

    # Output: predict next token (batch_size, seq_len, vocab_size)
    x = self.output(x)
    return x

# Hyperparameteres
vocab_size = 10_000  # From the tokenizer
embed_size = 128     # Size of word vectors
n_heads = 4          # Number of attention heads
hidden_size = 256    # Size of feedforward layer

# Initialize model
model = SimpleTransformer(vocab_size, embed_size, n_heads, hidden_size)

# Test encoded "Hello world! This is a test"
tokens = torch.tensor([[3352, 224, 18, 8, 6, 307, 1]])  # Shape: (1, 7)

# Test forward pass
output = model(tokens)
print(f"Output shape: {output.shape}")
print(f"Sample Prediction: {output[0, -1, :5]}") # First 5 logits of last token
```

## Step 5: Data Preperation

Now that the model architecture is complete we have one more step before we start to train our model, that being to prepare the data.

In this step we will turn `pile-10k` text into sequences of tokens that the model can use to predict the next token.

**Process:**
1. Tokenize all of `pile-10k` into one long list of IDs
2. Split it into manageable chunks (sequences)
3. Create input-target pairs for training  (Inputs are what the model sees; targets are what it should predict.)
4. Batch them for efficient GPU use

```py
# Tokenize the whole text
token_ids = tokenizer.encode(text)
print(f"Total Tokens: {len(token_ids)}")

# Create a custom Dataset
class TextDataset(Dataset):
  def __init__(self, token_ids, seq_length):
    self.token_ids = torch.tensor(token_ids, dtype=torch.long) # Conver to tensor
    self.seq_length = seq_length

  def __len__(self):
    # Number of sequences = total tokens minus sequence length
    return len(self.token_ids) - self.seq_length

  def __getitem__(self, idx):
    # Input: seq_length tokens starting at idx
    inputs = self.token_ids[idx:idx + self.seq_length]

    # Target: next seq_length tokens (shifted by 1)
    targets = self.token_ids[idx + 1:idx + self.seq_length + 1]
    return inputs, targets

# Hyperparameters
seq_length = 32
batch_size = 16

# Initialize Dataset
dataset = TextDataset(token_ids, seq_length)
print(f"Number of sequences: {len(dataset)}")

# Create Dataloader
dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

# Test it
for batch in dataloader:
    inputs, targets = batch
    print(f"Input shape: {inputs.shape}")
    print(f"Target shape: {targets.shape}")
    print(f"Sample input: {inputs[0]}")
    print(f"Sample target: {targets[0]}")
    break  # Just one batch to check
```

# Step 6: Training the Model

Now we can finally being the training of the model. We will be feedining the batches of sequences we have prepared into the transformer where it will compare its predictions (logits) to the targets and adjust the model's weight to improve.

**Tools:**
- Loss Function: Cross-entropy (measures prediction error)
- Optimizer: Adam (updates weights efficientyl)
- GPU: Move model and data to GPU for efficient training

```py
# Move to GPU if avaliable
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)
print(f"Using device: {device}")

# Loss and optimizer
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.0001)

# Training Loop
num_epochs = 5

for epoch in range(num_epochs):
  model.train()
  total_loss = 0
  for batch_idx, (inputs, targets) in enumerate(dataloader):
    # Move data
    inputs = inputs.to(device)
    targets = targets.to(device)

    # Forward pass
    optimizer.zero_grad()
    outputs = model(inputs)

    # Reshape for loss: [16*32, 10000] vs [16*32]
    outputs = outputs.view(-1, vocab_size)
    targets = targets.view(-1)

    # Compute loss
    loss = criterion(outputs, targets)
    total_loss += loss.item()

    # Backward pass and optimize
    loss.backward()  # Backpropagation
    optimizer.step()  # Gradient Descent

    # Progress (every 1000 batches)
    if (batch_idx + 1) % 1000 == 0:
      print(f"Epoch [{epoch+1}/{num_epochs}], Batch [{batch_idx+1}/{len(dataloader)}], Loss: {loss.item():.4f}")

  # Average loss per epoch
  avg_loss = total_loss / len(dataloader)
  print(f"Epoch [{epoch+1}/{num_epochs}] completed, Average Loss: {avg_loss:.4f}")

# Save the model
torch.save(model.state_dict(), "simple_transformer.pth")
print("Training done! Model saved.")
```

# Step 7: Generate Text

Now we can finally interact with the model! We will load in the complete model with the trained weights and set it to `eval` mode to generate.

The generate function takes a prompt and predicts up to 25 tokens using the tokenizer.

```py
# Load trained model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = SimpleTransformer(vocab_size, embed_size, n_heads, hidden_size)
model.load_state_dict(torch.load("simple_transformer.pth"))
model.to(device)
model.eval()

# Function to generate text
def generate_text(prompt, max_length=25, temperature=1.0):
    # Encode Prompt -- Turn prompt into token IDs for model
    input_ids = torch.tensor([tokenizer.encode(prompt)], dtype=torch.long).to(device)
    generated = input_ids.tolist()[0]

    for _ in range(max_length):
        # Preidct Logits for Words
        with torch.no_grad():
            outputs = model(input_ids)
            # Pick the next word
            next_token_logits = outputs[0, -1, :] / temperature
            next_token = torch.argmax(next_token_logits).item()
            generated.append(next_token)
            # Add token and check for end
            if next_token == tokenizer.vocab["<EOS>"]:
                break
            # Update Input
            input_ids = torch.tensor([generated], dtype=torch.long).to(device)
    # Decode Prompt
    return tokenizer.decode(generated)

# Interactive loop
print("Welcome to your SimpleTransformer chatbot!")
print("Enter a prompt to generate text (or 'quit' to exit):")
while True:
    prompt = input("> ")
    if prompt.lower() == "quit":
        break
    generated_text = generate_text(prompt, max_length=20)
    print(f"Generated: {generated_text}")
```

# Results

**Loss:**  
Average Loss after 5 epochs: 2.6927 (~6.76% confidence per token, ~50-60% top-1 accuracy)

**Parameters:**  
Total Parameters: ~2.7M
- Embedding Layer: 1,280,000 (vocab_size=10,000, embed_size=128)  
- Attention Layer: 66,048 (embed_size=128, n_heads=4)  
- Feedforward Layer: 65,920 (embed_size=128, hidden_size=256)  
- Output Layer: 1,290,000 (embed_size=128, vocab_size=10,000)  
- LayerNorms (2): 512 (embed_size=128)

Epochs: 5 (~45-60 minutes each on T4 GPU)  
Learning Rate: 0.0001  
Batch Size: 16  
Sequence Length: 32  

## Outcome  
Trained a ~2.7M parameter SimpleTransformer on ~9.5M tokens from `NeelNanda/pile-10k` on Kaggle using T4 GPU's. After 5 epochs, achieved an average loss of ~2.6927, translating to ~6.76% confidence per token and ~50-60% top-1 accuracy. The model generates basic and repetitive text reflecting its single-layer design and limited training. 

For a solo run with just a couple Epochs, this is a decent proof-of-concept and good way to better understand the architecture of Language Models. Next steps could include more epochs (~2-2.5 loss) or fine-tuning a larger pretrained model for better fluency.

*Note: there are many different approaches to building lanuage models and this is by no means the best approach. My goal here was to better understand the technology and process and in turn build a simple but standard model.*