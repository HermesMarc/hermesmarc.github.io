---
layout: post
title: "co-Leibniz Identity for Decidability"
tags: [logic] [Heyting] [math]
katex: true
---

[Heyting algebras](https://ncatlab.org/nlab/show/Heyting+algebra) are structures that can be used to give a semantics to intuitionistic propositional logic, and as it turns out, they can easily be dualised, yielding the aptly named [*co-Heyting algebras*](https://ncatlab.org/nlab/show/co-Heyting+algebra). These come equipped with three binary operations $(\land, \lor, \leftharpoondown)$,  where $\leftharpoondown$ is the dual of implication $\to$ and usually called *subtraction* or *exclusion*.

I will not go into too much detail on co-Heyting algebras here, but let me at least give you an intuition for why the name *subtraction* makes sense. In a Heyting algebra we have the following identity:
$$
 a \land b \leq c \iff a \leq (b \to c)
$$
If you imagine the $\leq$ to be another $\to$, then the above reads  $a \land b \to c \iff a \to (b \to c)$  which should look like a familiar logical principle / currying of functions / adjunction of functors. The dualized identity in a co-Heyting algebra looks like this:
$$
 a \leq b \lor c \iff (a \leftharpoondown b) \leq c
$$
And if you think of $\lor$ as $+$, then the above tells us that we can subtract $b$ on both sides of the left equation without breaking the inequality.

Let's now move on to the main definition in co-Heyting algebras that I want to highlight here: the [*boundary*](https://ncatlab.org/nlab/show/co-Heyting+boundary#definition) of an element $s$, which is defined by
$$
	\partial s := s \land \neg s.
$$
One can then show that this definition of a boundary satisfies the Leibniz rule we know for example from calculus:
$$
	\partial (a \land b) = (\partial a \land b) \lor (a \land \partial b)
$$
What surprised me was that [nLab](https://ncatlab.org/nlab/show/Heyting+algebra#properties) does not mention any comparable definition for Heyting algebras, even though we have this strong duality between the two.
And indeed, if we straight up dualise the definition, by flipping $\land$ and $\lor$ as well as the negation, we get an expression that looks oddly familiar
$$
	\delta s := s \lor \neg s
$$
In constructive logic, $\varphi \lor \neg \varphi$  is often referred to as the "decidability" of a statement $\varphi$.

Accordingly, we can indeed state and prove a dualised version of the Leibniz rule for this decidability operator:
$$
	\delta (a \lor b) = (\delta a \lor b) \land (a \lor \delta b)
$$
This can be verified for any Heyting algebra, but below I give a quick verification of this fact by using the usual definition of decidability in the Coq proof assistant:
```
Definition iffT (X Y: Type) : Type := (X -> Y) * (Y -> X).
Notation "X <=> Y" := (iffT X Y) (at level 95).

Definition dec (P : Type) : Type := P + (P -> False).

Lemma dec_sum A B :
  dec (A + B) <=> (dec A + B) * (A + dec B).
Proof.
  split; intros H; unfold dec.
  - destruct H as [|]; split; try tauto.
  - destruct H as [[[]|] [|[]]]; try tauto.
Qed.
```
While I don't have a good intuitive grasp on why the equivalence holds, I *can* give a good pictorial view on how to think about both $\partial$ and $\delta$.

Consider a Venn-diagram showing overlapping sets sets $A$ and $B$. We can then think of the boundary $\partial A$ as being the line that we would use to outline the set $A$, likewise for the boundary of other sets. The Leibniz identity then simply reflects a way to compute the boundary $\partial (A \cap B)$ based on the boundaries of $A$ and $B$.
A similar visual explanation holds up for $\delta A$; it consists of everything in the picture *except* the boundary $\partial A$.

Apart from the connection to decidability I showed above, I have not yet encountered the co-Leibniz identity elsewhere *"in the wild"*, and the same goes for people I have asked so far. So if you have, I would be interested to hear about it!
