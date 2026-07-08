---
layout: post
date: 2023-11-19
title: "Co-Leibniz Identity for Decidability"
tags: [logic, Heyting, math]
---

[Heyting algebras](https://ncatlab.org/nlab/show/Heyting+algebra) are structures that can be used to give a semantics to intuitionistic propositional logic, and as it turns out, they can easily be dualised, yielding the aptly named [_co-Heyting algebras_](https://ncatlab.org/nlab/show/co-Heyting+algebra).

Co-Heyting algebras come equipped with three binary operations $(\land, \lor, \leftharpoondown)$, where $\leftharpoondown$ is the dual of implication $\to$ and usually called _subtraction_ or _exclusion_.

I will not go into too much detail on co-Heyting algebras here, but let me at least give you an intuition for why the name _subtraction_ makes sense. In a Heyting algebra we have the following identity:

$$
 a \land b \leq c \iff a \leq (b \to c)
$$

If you imagine the $\leq$ to be another $\to$, then the above reads $a \land b \to c \iff a \to (b \to c)$ which should look like a familiar logical principle / currying of functions / adjunction of functors. The dualized identity in a co-Heyting algebra looks like this:

$$
 a \leq b \lor c \iff (a \leftharpoondown b) \leq c
$$

And if you think of $\lor$ as $+$, then the above tells us that we can subtract $b$ on both sides of the left equation without breaking the inequality.

Let's now move on to the main definition in co-Heyting algebras that I want to highlight here: the [_boundary_](https://ncatlab.org/nlab/show/co-Heyting+boundary#definition) of an element $s$, which is defined by

$$
	\partial s := s \land \neg s.
$$

The interesting thing about this definition of a boundary is that it satisfies the Leibniz rule familiar from calculus:

$$
	\partial (a \land b) = (\partial a \land b) \lor (a \land \partial b)
$$

What surprised me was that [nLab](https://ncatlab.org/nlab/show/Heyting+algebra#properties) does not mention any comparable definition for Heyting algebras, even though we have this strong duality between the two.
And indeed, if we straight up dualise the definition, by flipping $\land$ and $\lor$ as well as the negation, we get an expression that looks oddly familiar

$$
	\delta s := s \lor \neg s
$$

In constructive logic, $\varphi \lor \neg \varphi$ is often referred to as the "decidability" of a statement $\varphi$.

Accordingly, we can indeed state and prove a dualised version of the Leibniz rule for this decidability operator:

$$
	\delta (a \lor b) = (\delta a \lor b) \land (a \lor \delta b)
$$

This can be verified for any Heyting algebra, but below I give a quick verification of this fact by using the usual definition of decidability in the Rocq prover:

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

While I don't have a good intuitive grasp on why the equivalence holds, I _can_ give a good pictorial view on how to think about both $\partial$ and $\delta$.

Consider a Venn-diagram showing overlapping sets $A$ and $B$. We can then think of the boundary $\partial A$ as the line that we would use to outline the set $A$, and likewise for the boundary of other sets. The Leibniz identity then simply reflects a way to compute the boundary $\partial (A \cap B)$ based on the boundaries of $A$ and $B$.
A similar visual explanation holds up for $\delta A$; it consists of everything in the picture _except_ the boundary $\partial A$.

<style>
.fig-coleibniz {
  --fig-term1: #2a78d6;
  --fig-term2: #eb6834;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin: 2rem auto;
  max-width: 680px;
}
html[data-theme="dark"] .fig-coleibniz {
  --fig-term1: #3987e5;
  --fig-term2: #d95926;
}
.fig-coleibniz svg {
  flex: 1 1 190px;
  max-width: 224px;
  height: auto;
  display: block;
}
.fig-coleibniz text {
  font-family: inherit;
}
</style>

<figure class="fig-coleibniz">
  <svg viewBox="0 0 220 236" role="img" aria-label="Venn diagram of sets A and B where the outline of circle A is highlighted as the boundary of A">
    <circle cx="80" cy="95" r="52" fill="var(--global-text-color)" fill-opacity="0.05"/>
    <circle cx="140" cy="95" r="52" fill="none" stroke="var(--global-text-color-light)" stroke-opacity="0.8" stroke-width="1.3"/>
    <circle cx="80" cy="95" r="52" fill="none" stroke="var(--fig-term1)" stroke-width="3.5"/>
    <text x="55" y="100" text-anchor="middle" font-size="14" font-style="italic" fill="var(--global-text-color-light)">A</text>
    <text x="165" y="100" text-anchor="middle" font-size="14" font-style="italic" fill="var(--global-text-color-light)">B</text>
    <text x="110" y="200" text-anchor="middle" font-size="15.5" font-weight="600" fill="var(--global-text-color)">∂<tspan font-style="italic">A</tspan></text>
    <text x="110" y="222" text-anchor="middle" font-size="12.5" fill="var(--global-text-color-light)">the outline of <tspan font-style="italic">A</tspan></text>
  </svg>
  <svg viewBox="0 0 220 236" role="img" aria-label="Venn diagram where the boundary of the intersection of A and B is split into the arc of the boundary of A inside B and the arc of the boundary of B inside A, in two colors">
    <path d="M 110 52.5 A 52 52 0 0 1 110 137.5 A 52 52 0 0 1 110 52.5 Z" fill="var(--global-text-color)" fill-opacity="0.07"/>
    <circle cx="80" cy="95" r="52" fill="none" stroke="var(--global-text-color-light)" stroke-opacity="0.8" stroke-width="1.3"/>
    <circle cx="140" cy="95" r="52" fill="none" stroke="var(--global-text-color-light)" stroke-opacity="0.8" stroke-width="1.3"/>
    <path d="M 110 52.5 A 52 52 0 0 1 110 137.5" fill="none" stroke="var(--fig-term1)" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M 110 137.5 A 52 52 0 0 1 110 52.5" fill="none" stroke="var(--fig-term2)" stroke-width="3.5" stroke-linecap="round"/>
    <text x="55" y="100" text-anchor="middle" font-size="14" font-style="italic" fill="var(--global-text-color-light)">A</text>
    <text x="165" y="100" text-anchor="middle" font-size="14" font-style="italic" fill="var(--global-text-color-light)">B</text>
    <text x="110" y="200" text-anchor="middle" font-size="15.5" font-weight="600" fill="var(--global-text-color)">∂(<tspan font-style="italic">A</tspan> ∩ <tspan font-style="italic">B</tspan>)</text>
    <line x1="24" y1="218" x2="42" y2="218" stroke="var(--fig-term1)" stroke-width="3.5" stroke-linecap="round"/>
    <text x="48" y="222" font-size="12.5" fill="var(--global-text-color-light)">∂<tspan font-style="italic">A</tspan> ∩ <tspan font-style="italic">B</tspan></text>
    <line x1="122" y1="218" x2="140" y2="218" stroke="var(--fig-term2)" stroke-width="3.5" stroke-linecap="round"/>
    <text x="146" y="222" font-size="12.5" fill="var(--global-text-color-light)"><tspan font-style="italic">A</tspan> ∩ ∂<tspan font-style="italic">B</tspan></text>
  </svg>
  <svg viewBox="0 0 220 236" role="img" aria-label="The whole picture shaded except for a blank ring along the outline of circle A, illustrating that delta A is everything except the boundary of A">
    <mask id="coleibniz-ring" maskUnits="userSpaceOnUse" x="0" y="0" width="220" height="236">
      <rect x="0" y="0" width="220" height="236" fill="#fff"/>
      <circle cx="80" cy="95" r="52" fill="none" stroke="#000" stroke-width="8"/>
    </mask>
    <rect x="8" y="16" width="204" height="158" rx="12" fill="var(--global-text-color)" fill-opacity="0.07" mask="url(#coleibniz-ring)"/>
    <circle cx="140" cy="95" r="52" fill="none" stroke="var(--global-text-color-light)" stroke-opacity="0.8" stroke-width="1.3" mask="url(#coleibniz-ring)"/>
    <text x="55" y="100" text-anchor="middle" font-size="14" font-style="italic" fill="var(--global-text-color-light)">A</text>
    <text x="165" y="100" text-anchor="middle" font-size="14" font-style="italic" fill="var(--global-text-color-light)">B</text>
    <text x="110" y="200" text-anchor="middle" font-size="15.5" font-weight="600" fill="var(--global-text-color)">δ<tspan font-style="italic">A</tspan></text>
    <text x="110" y="222" text-anchor="middle" font-size="12.5" fill="var(--global-text-color-light)">everything except ∂<tspan font-style="italic">A</tspan></text>
  </svg>
</figure>

Apart from the connection to decidability I showed above, I have not yet encountered the co-Leibniz identity elsewhere _"in the wild"_, and the same goes for people I have asked so far. So if you have, I would be interested to hear about it!
