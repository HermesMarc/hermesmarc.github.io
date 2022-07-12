---
layout: post
title: "How to make finite Functions cycle together  🚴🏻‍♀️🚴🏿🚴‍♂️"
tags: [Puzzle]
katex: True
---

In this post I talk about functions on finite sets and their passion for cycling.
An inescapable passion of them really, all of them do it, and none can escape its pull.

> ***Puzzle 1:*** Let $$f : X \to X$$ be some function on a finite set $$X$$. Show that no matter the starting point $$x \in X$$, after some number of steps $$k \in \mathbb{N}$$, the function $$f$$ will start cycling.

There are some terms that are in need of clarification in the above [...]

> ***Puzzle 2:*** Let $$X$$ be a finite set. Show that there are numbers $$k < c$$ such that no matter the function $$f : X \to X$$ and starting value $$x$$, after $$k$$ steps $$f$$ will start to cycle and return to $$f^k(x)$$ after an additional $$c$$ steps.

Again, to be completely unambiguous I will also give you the mathematical statement:

> $$X$$ finite $$\implies$$ $$\exists \, k,c. ~~ k < c ~\land~ \forall (f : X \to X) \, \forall x. ~ f^k (x) = f^{c+k}(x)$$.

----

It is finally time to present the solutions for both puzzles. 

> ***Solution for Puzzle 1:*** Assume that $$X$$ has $$n$$ elements, and let $$f$$ and $$x$$ be given. 
> Looking at the list $$f^0 (x) , \dots, f^n(x)$$ of elements from $$X$$ we recognize that it has $$n+1$$ elements. 
> But $$X$$ only has $$n$$ elements... so at least two of the elements from this list must already be equal! (The infamous [pigeonhole principle](https://en.wikipedia.org/wiki/Pigeonhole_principle)). 
> We can therefore conclude that there are $$f^k(x) = f^j(x)$$ with $$0 \leq k < j \leq n$$. 
> Furthermore splitting $$j$$ as $$j = c + k$$ for some $$c$$, it highlights that we have:
>
>$$ 
>   f^k(x) = f^{c + k} (x) = f^c(f^k(x)). 
>$$
>
> In words: once we arrive at $$f^k(x)$$, we cycle back to it after $$c$$ additional steps; just as desired.