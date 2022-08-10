
I have just recently returned from my trip to Haifa, where I attended the FSCD conference which was part of FLoC this year.
Having presented our paper on Tennenbaum's theorem there, my memories are still fresh I want to use the opportunity to sit down and write a post on the theorem, with the goal to present one of its proof which uses one of mathematics finest proof techniques: the diagonal argument.

To get started, let's first have a look at a familiar world: the world of natural numbers.

## Peano Arithmetic

The most influential and time-proven formalization of the natural number is to this day given by the axiom system which was formulated by Peano.
Disregarding induction, these are:

> Axioms

And they describe that zero has no successor, no two elements have the same successor and tell us how addition and multiplication are to be computed.

The intended goal of these axioms is it to describe set of natural numbers $\mathbb{N}$.
We are actually so accustomed to the fact that $\mathbb{N}$ satisfies these axioms; it might not cross everyone's mind that the natural numbers don't have to be the only set which satisfy these axioms.

---

Given a finite set like $\{ 3,8,22\}$


----

## Numerals

Assume we have any model $M$ of PA, then it will come with a zero element $0^M$ and the successor function $S^M$. This allows us to define a function $\overline{\, \cdot \,} : \mathbb{N} \to M$ satisfying
$$
  \overline n = \underbrace{S^M \dots S^M}_{n \text{ times}} \, 0^M
$$
So we get the elements
$$
\begin{aligned}
  \overline 0 &= 0^M \\ 
  \overline 1 &= S^M 0^M \\ 
  \overline 2 &= S^M S^M 0^M \\ 
  \overline 3 &= S^M S^M S^M 0^M \\ 
  &\dots
\end{aligned}
$$
inside of $M$. We therefore see: every model of PA has a copy of the natural numbers sitting inside of it! 
We call the above elements the *numerals* of the model and also refer to them as *standard numbers*.

A model gets interesting once it has more than just the standard numbers, i.e. once it has an element $e : M$ satisfying
$$
  \forall n : \mathbb{N}. ~~ e \neq \overline n
$$


## Non-standard Models

So how would a countable non-standard model look like? Well first of all, we always have the natural numbers sitting inside of any other model of PA. This is simply due to the fact that any model M has a zero element $0^M$ and the successor function $S^M$, so we get the elements
$$
\begin{aligned}
  0^M \\ S^M 0^M \\ S^M S^M 0^M \\ S^M S^M S^M 0^M \\ \dots
\end{aligned}
$$
which we can clearly identify with $0, 1, 2, 3, \dots$ Put another way: we have a function $\overline{\, \cdot \,} : \mathbb{N} \to M$ which satisfies
$$
  \overline n = \underbrace{S^M \dots S^M}_{n \text{ times}} \, 0^M
$$
and we can even show that this function is injective. Any element of a model that we can get in this way - by applying $S^M$ several times to $0^M$ - will be called a *numeral*. They are basically the natural numbers, but sitting inside of $M$.

A countable model is one where we have a surjective function $g : \mathbb{N} \to M$. So if we look at the infinite list
$$
  g(0), g(1), g(2), g(3), \dots
$$
Then every element of $M$ will appear in the list at some point.