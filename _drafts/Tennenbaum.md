
I have just recently returned from my trip to Haifa, where I attended the FSCD conference which was part of FLoC this year.
Having presented our paper on Tennenbaum's theorem there, my memories are still fresh, and I want to use the opportunity to sit down and write a post on the theorem, with the goal to present one of its proof which uses one of mathematics finest proof techniques: the diagonal argument.

To get started, let's first have a look at a familiar world: the world of natural numbers.

## Peano Arithmetic

The most influential and time-proven formulation of what the natural numbers are, is to this day to one given by Peano.
Disregarding induction, these are:

> Axioms

And they describe that zero has no successor, no two elements have the same successor and tell us how addition and multiplication are to be computed.

The intended goal of these axioms is it to describe the set of natural numbers $\mathbb{N}$ and basic operations on them.
We are actually so accustomed to the fact that $\mathbb{N}$ satisfies these axioms; it might not even cross everyone's mind that the set $\{0, 1, 2, \dots \}$ of natural numbers does not have to be the only set which satisfy these axioms.

---

## Coding

Is it possible to represent a whole finite set of numbers by one single number? 
The answer is: Yes!
And here is one way of how we can achieve this, by making use of prime numbers.
If we are given the finite set $S = \{ 3,8,22\}$ we get a single number by taking the following product of primes $c_S := \pi_3 \cdot \pi_8 \cdot \pi_{22}$, where $\pi_n$ stands for the $n$-th prime number.
This gives us the relationship
$$
 n \in S \iff \pi_n \text{ divides } c_S
$$
So by checking which primes divide $c_S$, we can reconstruct exactly which elements the finite set $S$ has. 
We therefore also say that $c_S$ is a *code-number* or simply *code* for the set $S$.
Disappointingly we can only use this to code finite sets, since an infinite set would give us an infinite product, which would not yield a well defined natural number.
We will however come back to this point shortly.

----

## Standard Numbers

Assume we have any model $M$ of PA, then in particular it comes with a zero element $0^M$ and a successor function $S^M : M \to M$. This allows us to define a function $\overline{\, \cdot \,} : \mathbb{N} \to M$ satisfying
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
We call the above elements the *standard numbers* of the model.


## Non-standard Models
The situation gets interesting once a model $M$ has more than just the standard numbers, i.e. once it has an element $e : M$ satisfying
$$
  \forall n : \mathbb{N}. ~~ e \neq \overline n
$$
We call such an element *non-standard* and likewise say that a model is non-standard if it has such an element.


A countable model is one where we have a surjective function $g : \mathbb{N} \to M$. So if we look at the infinite list
$$
  g(0), g(1), g(2), g(3), \dots
$$
Then every element of $M$ will appear in the list at some point.


## The Diagonal Argument

Let's now see why we cannot have a model $M$ which is

- countable,
- has computable divisibility,
- and is non-standard.

For the purpose of getting to a contradiction, assume that the above were true.
First of all, note that we then have a surjection $g : \mathbb{N} \to M$ which allows us to consider the following subset of numbers:
$$
  D := \{ \, n \mid \pi_n \text{ does not divide } g(n) \, \}
$$
Since divisibility is computable, this set is computable.
We learned earlier that a non-standard model comes with a non-standard element $e \in M$, and this in turn allow us to encode computable sets like $D$ as a single element in $M$, by multiplying prime numbers: 
$$
  c := \prod_{k < e, \, k \in D} \pi_k
$$
This element must also be hit by $g$ at some point, so there is $m \in \mathbb{N}$ such that $c = g(m)$.
But now an intriguing question presents itself: is $m \in D$ or not? Let's consider both options:

- If $m \in D$ then by the definition of $D$ this means that $\pi_m$ does not divide $g(m)$. 
But by the definition of $c$ we know that $\pi_m$ is part of the above product, and therefore $\pi_m$ does divide $c = g(m)$. Contradiction!
- If $m \not\in D$ we can work out a contradiction in the same fashion.

So either way, we end up with a contradiction!
We therefore have to conclude that a model with all of the listed properties simply does not exist.