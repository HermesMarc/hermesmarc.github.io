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

Intuitively, both of them seem to simply express *"$$x$$ is strictly smaller then $$y$$ and $$y$$ is less or equal to $$x$$"*, and intuition also tells us that this is a contradiction. While there is nothing to add to that conclusion, there *is* more to say about why both of them lead to a contradiction.

The first statement $$x < y \land \neg \, x < y$$ has the form $$A \land \neg A$$, and is therefore a contradiction for purely logical reasons. By this I mean that: for the contradiction to arise, it doesn't matter at all that we have a statement $$A := x < y$$ about numbers here.

This is not the case for $$x < y \land y \leq x$$, since it does not have the form $$A \land \neg A$$. We can however argue that $$y \leq x$$ is equivalent to $$\neg \, x < y$$ , therefore allowing us to draw the same conclusion. Phew. Easy after all. 
But let's consider yet another way to derive a contradiction here. For this approach, we need to dig up the axioms of arithmetic and the actual definitions of $$<$$ and $$\leq$$ in terms of successor, addition and equality.

$$
\begin{align*}
	x < y &:= \exists k. ~ x + S k = y \\
	y \leq x &:= \exists k. ~ y + k = x
\end{align*}
$$

Given we start with $$x < y$$ and  $$y \leq x$$, we know that there are $$k$$ and $$k'$$ such that $$x + Sk = y$$, and $$y + k' = x$$. Combined this gives $$x + S k + k' = x$$, and by cancelling $$x$$ and both sides we get $$S(k + k') = 0$$.
Aha! This latter conclusion is of course fishy. One of the axioms of Peano arithmetic tells us that $$\forall x. \neg \, S x  = 0$$, which then brings us to the contradiction $$S (k + k') = 0 \land \neg \, S (k + k') = 0$$. 

Let's highlight some of the things that happened in this last proof:

- We arrive at a contradiction of the form $$A \land \neg A$$, but this time the statement $$A$$ is $$S (k + k') = 0$$.
- To arrive at this conclusion we needed to make use of several results about number theory, including cancelation, and the axiom which states that zero has no predecessors.

This is in contrast to the very first contradiction we saw above, where it did not matter that we were dealing with a statement involving numbers. In hindsight, we should realise at this point that when we used the equivalence of $$y \leq x$$ and $$\neg \, x < y$$ as an easy way to the contradiction, we were forgetting that this equivalence also requires axioms in order to be shown. Oops.

The above discussion points out two sources of contradictions: 
1. In can be for purely logical reasons 
2. It can be derived from an axiom which contains a negation in its statement.

Needless to say; in the latter case we also make use of logical reasoning, but the point is that some contradictions cannot be reached without the right axiom, even in cases that appear obvious, like $$x < y \land y \leq x$$.
