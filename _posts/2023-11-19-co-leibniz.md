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

While I don't have a good intuitive grasp on why the equivalence holds, there is a good pictorial view on how to think about both $\partial$ and $\delta$.

Consider a Venn-diagram showing overlapping sets $A$ and $B$. We can then think of the boundary $\partial A$ as the line that we would use to outline the set $A$, and likewise for the boundary of other sets. The Leibniz identity then simply reflects a way to compute the boundary $\partial (A \cap B)$ based on the boundaries of $A$ and $B$.
A similar visual explanation holds up for $\delta A$; it consists of everything in the picture _except_ the boundary $\partial A$.

<style>
.venn-widget { --fig-accent: #2a78d6; margin: 2rem auto; max-width: 500px; user-select: none; -webkit-user-select: none; }
html[data-theme="dark"] .venn-widget { --fig-accent: #3987e5; }
.venn-widget .vw-controls { display: flex; flex-wrap: wrap; justify-content: center; align-items: flex-start; gap: 6px; margin-bottom: 0.75rem; }
.venn-widget .vw-ctl { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.venn-widget .vw-controls button { font: inherit; font-size: 0.85rem; padding: 4px 14px; border-radius: 999px; border: 1px solid var(--global-divider-color); background: transparent; color: var(--global-text-color); cursor: pointer; }
.venn-widget .vw-controls button:hover { border-color: var(--fig-accent); }
.venn-widget .vw-controls button.active { border-color: var(--fig-accent); color: var(--fig-accent); font-weight: 600; }
.venn-widget .vw-sub { display: flex; gap: 4px; }
.venn-widget .vw-sub button { font-size: 0.72rem; padding: 2px 9px; color: var(--global-text-color-light); }
.venn-widget svg { display: block; width: 100%; height: auto; touch-action: none; }
.venn-widget .vw-grip { cursor: grab; }
.venn-widget .vw-grip.dragging { cursor: grabbing; }
.venn-widget figcaption { text-align: center; font-size: 0.85rem; color: var(--global-text-color-light); margin-top: 0.5rem; line-height: 1.5; }
.venn-widget .vw-cap { color: var(--global-text-color); font-size: 0.95rem; }
.venn-widget .vw-t1, .venn-widget .vw-t2 { font-weight: 600; color: var(--global-text-color-light); }
.venn-widget .vw-t1.on, .venn-widget .vw-t2.on { color: var(--fig-accent); }
.venn-widget .vw-note { min-height: 1.3em; }
</style>

<figure class="venn-widget">
  <div class="vw-controls" aria-label="Choose what to display">
    <div class="vw-ctl">
      <button class="vw-main active" data-mode="dA" aria-pressed="true">∂<i>A</i></button>
    </div>
    <div class="vw-ctl">
      <button class="vw-main" data-mode="deltaA" aria-pressed="false">δ<i>A</i></button>
    </div>
    <div class="vw-ctl">
      <button class="vw-main" data-mode="dAB" aria-pressed="false">∂(<i>A</i> ∧ <i>B</i>)</button>
      <div class="vw-sub" data-sub="dAB" style="display:none">
        <button data-term="1" aria-pressed="true" class="active">∂<i>A</i> ∧ <i>B</i></button>
        <button data-term="2" aria-pressed="true" class="active"><i>A</i> ∧ ∂<i>B</i></button>
      </div>
    </div>
    <div class="vw-ctl">
      <button class="vw-main" data-mode="deltaAB" aria-pressed="false">δ(<i>A</i> ∨ <i>B</i>)</button>
      <div class="vw-sub" data-sub="deltaAB" style="display:none">
        <button data-term="1" aria-pressed="true" class="active">δ<i>A</i> ∨ <i>B</i></button>
        <button data-term="2" aria-pressed="true" class="active"><i>A</i> ∨ δ<i>B</i></button>
      </div>
    </div>
  </div>
  <svg id="vw-svg" viewBox="0 0 460 320" role="img" aria-label="Interactive Venn diagram of two sets A and B illustrating the boundary and decidability operators">
    <defs>
      <mask id="vw-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="460" height="320">
        <rect x="0" y="0" width="460" height="320" fill="#fff"></rect>
        <path id="vw-cut1" d="" fill="none" stroke="#000" stroke-width="9"></path>
        <path id="vw-cut2" d="" fill="none" stroke="#000" stroke-width="9"></path>
      </mask>
    </defs>
    <g mask="url(#vw-mask)">
      <rect id="vw-wash" x="6" y="6" width="448" height="308" rx="14" fill="var(--fig-accent)" fill-opacity="0.09" style="display:none"></rect>
      <path id="vw-lens" d="" fill="var(--global-text-color)" fill-opacity="0.07"></path>
      <circle id="vw-hairA" cx="185" cy="160" r="80" fill="none" stroke="var(--global-text-color-light)" stroke-opacity="0.8" stroke-width="1.3"></circle>
      <circle id="vw-hairB" cx="292" cy="160" r="66" fill="none" stroke="var(--global-text-color-light)" stroke-opacity="0.8" stroke-width="1.3"></circle>
      <path id="vw-arc1" d="M 105 160 A 80 80 0 1 0 265 160 A 80 80 0 1 0 105 160" fill="none" stroke="var(--fig-accent)" stroke-width="4" stroke-linecap="round"></path>
      <path id="vw-arc2" d="" fill="none" stroke="var(--fig-accent)" stroke-width="4" stroke-linecap="round"></path>
    </g>
    <text id="vw-labA" x="145" y="165" text-anchor="middle" font-size="16" font-style="italic" fill="var(--global-text-color-light)">A</text>
    <text id="vw-labB" x="325" y="165" text-anchor="middle" font-size="16" font-style="italic" fill="var(--global-text-color-light)">B</text>
    <circle id="vw-gripA" class="vw-grip" cx="185" cy="160" r="80" fill="transparent"></circle>
    <circle id="vw-gripB" class="vw-grip" cx="292" cy="160" r="66" fill="transparent"></circle>
  </svg>
  <figcaption>
    <div class="vw-cap" data-cap="dA">∂<i>A</i> — the outline of <i>A</i></div>
    <div class="vw-cap" data-cap="deltaA" style="display:none">δ<i>A</i> — everything except the boundary ∂<i>A</i></div>
    <div class="vw-cap" data-cap="dAB" style="display:none">∂(<i>A</i> ∧ <i>B</i>) = <span class="vw-t1 on">(∂<i>A</i> ∧ <i>B</i>)</span> ∨ <span class="vw-t2 on">(<i>A</i> ∧ ∂<i>B</i>)</span></div>
    <div class="vw-cap" data-cap="deltaAB" style="display:none">δ(<i>A</i> ∨ <i>B</i>) = <span class="vw-t1 on">(δ<i>A</i> ∨ <i>B</i>)</span> ∧ <span class="vw-t2 on">(<i>A</i> ∨ δ<i>B</i>)</span></div>
    <div class="vw-note" id="vw-note"></div>
  </figcaption>
</figure>

<script src="{{ '/assets/js/venn-coleibniz.js' | relative_url }}" defer></script>

Apart from the connection to decidability I showed above, I have not yet encountered the co-Leibniz identity elsewhere _"in the wild"_, and the same goes for people I have asked so far. So if you have, I would be interested to hear about it!
