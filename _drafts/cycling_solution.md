---
layout: post
title: "How to make finite Functions cycle together!  🚴🏻‍♀️🚴🏿🚴‍♂️"
tags: [Puzzle, Solution]
katex: True
---


It is finally time to present the solutions for both puzzles. 

> ***Solution for Puzzle 1:*** Assume that $X$ has $n$ elements, and let $f$ and $x$ be given. 
> Looking at the list $f^0 (x) , \dots, f^n(x)$ of elements from $X$ we recognize that it has $n+1$ elements. 
> But $X$ only has $n$ elements... so at least two of the elements from this list must already be equal! (The infamous [pigeonhole principle](https://en.wikipedia.org/wiki/Pigeonhole_principle)). 
> We can therefore conclude that there are values $j, k$ with $0 \leq j < k \leq n$ and satisfying the equality $f^j(x) = f^k(x)$. 
> Furthermore splitting $k$ as $k = c + j$ for some $c$, it highlights that we have:
>
>$$ 
>   f^k(x) = f^{c + j} (x) = f^c(f^j(x)). 
>$$
>
> In words: once we arrive at $f^j(x)$, we cycle back to it after $c$ additional steps; just as desired.