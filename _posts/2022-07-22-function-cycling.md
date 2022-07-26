---
layout: post
title: "How to make finite Functions cycle together?  🚴🏻‍♀️🚴🏿🚴‍♂️"
tags: [Puzzle]
katex: True
---

In this post I want to have a look at functions on finite sets and one of their inescapable passions: cycling.

Given any set $$X$$, element $$x \in X$$ and function $$f : X \to X$$ we can repeatably apply the function to $$x$$ to get a infinite sequence of values $$f (x), f(f (x)), f( f(f (x))), \dots$$ also written $$f^1 (x), f^2 (x), f^3 (x), \dots$$ if we just add an exponent to $$f$$ to indicate how often we applied it to $$x$$.

This sequence is not always infinitely interesting. 
In the extreme case, where $$X$$ only has one element $$x_0$$, the only possible function there is $$x_0 \mapsto x_0$$, giving us

$$ 
f^1 (x_0), f^2 (x_0), f^3 (x_0), \dots \, = \,x_0, x_0, x_0, \dots
$$

The result we get is quite repetitive, just continues on in the same fashion, never changes or adds something new, is therefore not very interesting, and is kind of just dragging along, just like this sentence.
It gets a bit more interesting if we let $$X$$ have a few more elements.
Take $$X = \{1, 2, 3, 4\}$$ for example, and the function defined by

$$
  f(1) := 3, ~f(2) := 2, ~f(3) := 4, ~f(4) := 1.
$$

If you play around with some starting values (there aren't that many) you will quickly see that repetition strikes again.
Similarly to the very easy case of the one element set, here too our function seems to always end up in a cycle, only that they can contain more elements.
A more general principle seems to be at play, which brings us to our first puzzle:

> ***Puzzle 1:***
> Let $$f : X \to X$$ be some function on a finite set $$X$$. Show that there is an element $$a \in X$$ to which $$f$$ will always cycle back to.

By *cycling back to $$a$$* we mean that there is some number of steps $$c \in \mathbb{N}$$ such that $$f^c (a) = a$$. 

So while puzzle 1 claims that functions on finite sets enjoy cycling on their own, what about them cycling together?

> ***Puzzle 2:*** Let $$X$$ be a finite set. Show that there is a number $$k$$ such that no matter the starting value $$x$$, all functions $$f : X \to X$$ will cycle around $$f^k(x)$$.

The latter statement tells us that at least after $$k$$ steps, all functions will start to cycle or will already by cycling; it's therefore a truly popular sport.  

----

To be unambiguous with the puzzles, here are possible ways to formulate them in a fully formal way:

> 1) $$X$$ finite $$\implies$$ $$\forall (f : X \to X) \, \exists a \in X. ~\exists \, c. ~f^{c}(a) = a$$.
> 
> 2) $$X$$ finite $$\implies$$ $$\exists \, k,c. ~~ k < c ~\land~ \forall (f : X \to X) \, \forall x. ~  f^{c+k}(x) = f^k (x)$$.