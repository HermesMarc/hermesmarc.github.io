---
layout: post
date: 2023-12-02
title: "Not all Contradictions are created equal"
tags: [logic, math]
---

In logic and mathematics, we usually try to avoid them, but admittedly, sometimes they are also exactly what we are after: Contradictions. Not all contradictions are made equal, as we can identify at least two sources from which they can arise, and which are worth keeping in mind.

To clarify the distinction, let's consider the following very similar statements in arithmetic:

$$
\begin{align}
	x < y &\land \neg \, x < y \\
	x < y &\land ~~ ~y \leq x
\end{align}
$$

Intuitively, both options simply seem to express *"$$x$$ is strictly smaller then $$y$$* and *$$y$$ is less or equal to $$x$$"*, and intuition also tells us that these statements are in contradiction to each other. 
While there is nothing to add to that conclusion, there *is* more to say about why both cases lead to a contradiction.

Statement $$(1)$$ has the form $$A \land \neg A$$, and is therefore a contradiction for purely logical reasons. 
By this I mean that: We could replace $$A$$ with any statement we like, and 
the combined expression $$A \land \neg A$$ would always be a contradiction.
I didn't really matter that in our case $$A$$ had to do something with numbers.

This is not the case for statement $$(2)$$; it does not have the form $$A \land \neg A$$! 
We can however argue that $$y \leq x$$ is equivalent to $$\neg \, x < y$$ , therefore allowing us to draw the same conclusion. Phew. Easy after all. 
But let's consider yet another way to derive a contradiction here. 
For this, we dig a bit deeper and look at the actual definitions of $$<$$ and $$\leq$$ in terms of addition and equality.

$$
\begin{align*}
	a < b &:= \exists k. ~ a + k + 1 = b \\
	a \leq b &:= \exists k. ~ a + k ~~~~~~~= b
\end{align*}
$$

Given we start with $$x < y$$ and  $$y \leq x$$, we know that there are $$k$$ and $$k'$$ such that $$x + k + 1 = y$$, and $$y + k' = x$$. Combined this gives $$x + k + 1 + k' = x$$, and by cancelling $$x$$ and both sides we get $$k + k' + 1 = 0$$.
Aha! This latter conclusion is of course fishy. One of the axioms of Peano arithmetic tells us that $$\forall x \, \neg (x + 1 = 0)$$, which then brings us to the contradiction:

$$
  k + k' + 1 = 0 \land \neg (k + k' + 1 = 0).
$$

Let's highlight some of the things that happened in this last proof:

- We arrive at a contradiction of the form $$A \land \neg A$$, but this time the statement $$A$$ is $$k + k' + 1 = 0$$.
- To arrive at this conclusion we needed to make use of several results about number theory, including cancelation, and the axiom which states that zero has no predecessors.

This is in contrast to the very first contradiction we saw above, where it did not matter that we were dealing with a statement involving numbers. In hindsight, we should realise at this point that when we used the equivalence of $$y \leq x$$ and $$\neg \, x < y$$ as an easy way to the contradiction, we were forgetting that this equivalence also requires axioms in order to be shown. Oops.

The above discussion points out two sources of contradictions: 
1. In can be for purely logical reasons 
2. It can be derived from an axiom which contains a negation in its statement.

Needless to say; in the latter case we also make use of logical reasoning, but the point is that some contradictions cannot be reached without the right axiom, even in cases that appear obvious, like $$x < y \land y \leq x$$.
