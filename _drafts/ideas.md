## Blog Post Ideas

- *"$n + 1$ Pigeons walk into $n$ Bars..."*
  - Present the formalized proof of the pigeonhole principle.
  - Mention how it can be rewritten to a proof of the contraposition.
- *"Counting on recursion; Y combinators matter"*
  - The defining equations of a recursive function `f` inherently are always of the form `f = spec(f)`. So we are looking for a fixed-point of `spec`. 
  - Discuss Y-wrappers
  - Present [this code](https://gist.github.com/HermesMarc/fd4017e1da99328d616cb6f068d1f6d0)
- The Lawvere Fixpoint Theorem and the First Order Diagonalization Lemma as one of its instances.
- The diagonal proof of Tennenbaum's theorem
- Copy-Paste is Turing Complete
  - Basically the untyped $\lambda$-calculus can be regarded as a formalization of copy-pasting.
  - Variables $x$ correspond to `paste x` i.e. locations where something can be pasted to.
  - and $\lambda x$ corresponds to `copy x`, i.e. a command that takes some input, copies it and pastes it to all locations `paste x`.
- Dual and double dual of Vector spaces, and why the function $V \to V^{\ast \ast}$ is trivial to find as a type-theorist.
- *"The explosiveness of atoms."*
  - Post about that question on SE that I answered and which had this useful insight.