Try to think of all numbers, neatly lined up
$$
0,1,2,3,4,5 \dots
$$
(Construct to the reader the image of a non-standard PA model)




## Peano Arithmetic

The most influential and time-proven formulation of what the natural numbers are, is to this day the one given by Italian mathematician Giuseppe Peano.
Disregarding induction, these are:

> Axioms

And they describe that zero has no successor, no two elements have the same successor and tell us how addition and multiplication are to be computed.

The intended goal of these axioms is it to describe the set of natural numbers $\mathbb{N}$ and basic operations on them.
We are actually so accustomed to the fact that $\mathbb{N}$ satisfies these axioms; it might not even cross everyone's mind that the set $\{0, 1, 2, \dots \}$ of natural numbers does not have to be the only set which satisfy these axioms.

---

## Coding

Is it possible to represent a whole finite set of numbers by one single number? 
The answer is: Yes!
And here is one to achieve this, which makes use of prime numbers.
If we are given the finite set $S = \{ 3,8,22\}$ we form the product of primes $c_S := \pi_3 \cdot \pi_8 \cdot \pi_{22}$, where $\pi_n$ stands for the $n$-th prime number.
By the special properties that prime numbers have when divisibility is concerned, this gives us the relationship
$$
 n \in S \iff \pi_n \text{ divides } c_S
$$
So by checking which primes divide $c_S$, we can easily reconstruct $S$. 
We call $c_S$ a *code-number* or simply *code* for the set $S$.
Disappointingly we can only use this to code finite sets, since an infinite set would require an infinite product of numbers in $\mathbb{N}$.


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
Models of Peano Arithmetic get interesting once they have more than just the standard numbers.
Yes you heard that right! We can have a model $M$, which has an element $e : M$ satisfying
$$
  \forall n : \mathbb{N}. ~~ e \neq \overline n
$$
We call such an element *non-standard* and likewise say that a model is non-standard if it has such an element.
A non-standard element $e$ is not $0$, so it has a predecessor $e-1$, which is also non-standard (if it were standard, $e$ would be too). 
It then becomes clear that there really is an infintie line of predecessors preceding $e$, and likewise a line of successors:
$$
  \dots, e-3, e-2, e-1, \,e \, , e+1 , e+2, e+3, \dots
$$
All of these are sitting beyond the reach of the standard numbers:
$$
  0, 1, 2, 3, 4, \dots ~~~~~<~~~~~\dots,\, e-3 \,,\, e-2 \,,\, e-1 \,, \,e \, ,\, e+1 \, , \, e+2 \, , \, e+3 \, , \dots
$$
We already observed in the above that every PA model contains a copy of $\mathbb{N}$, but we have now made the observation that a non-standard model also has at least one copy of $\mathbb{Z}$ sitting inside of it. 
$$
  \underbrace{0, 1, 2, 3, 4, \dots}_{\text{copy of } \mathbb{N}} ~~~~~<~~~~~ \underbrace{\dots,\, e-3 \,,\, e-2 \,,\, e-1 \,, \,e \, ,\, e+1 \, , \, e+2 \, , \, e+3 \, , \dots}_{\text{copy of } \mathbb{Z}}
$$


A countable model is one where we have a surjective function $g : \mathbb{N} \to M$. So if we look at the infinite list
$$
  g(0), g(1), g(2), g(3), \dots
$$
Then every element of $M$ will appear in the list at some point.


## The Diagonal Argument

Let's now see what happens if we have a model $M$ which is

- countable,
- non-standard,
- has computable divisibility.

Since it is countable, we get a surjection $g : \mathbb{N} \to M$, allowing us to consider the following subset of numbers:
$$
  D := \{ \, n \mid \pi_n \text{ does not divide } g(n) \, \}
$$
We can always compute whether for some natural number $x$ we have $x \in D$, since divisibility is computable in the considered model.
By assumption, the model also comes with a non-standard element $e \in M$, which allow us to encode computable sets like $D$ by a single element in $M$.
Just as we did earlier, we do this by multiplying prime numbers: 
$$
  c := \prod_{k < e, \, k \in D} \pi_k
$$
Now comes the critical part: This element must also be hit by $g$ at some point, so there is $m \in \mathbb{N}$ such that $c = g(m)$.
With this in hand, an intriguing question presents itself: is $m \in D$ or not? Let's consider both options:

- If $m \in D$ then by the definition of $D$ this means that $\pi_m$ does not divide $g(m)$. 
But by the definition of $c$ we know that $\pi_m$ is part of the above product, and therefore $\pi_m$ does divide $c = g(m)$. Contradiction!
- If $m \not\in D$ we can reason in the same way and will again arrive at a contradiction.

So either way, we end up with a contradiction!
We therefore have to conclude that a model with all of the listed properties simply does not exist.