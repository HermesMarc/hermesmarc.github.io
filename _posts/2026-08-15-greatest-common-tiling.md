---
layout: post
date: 2026-08-15
title: "Greatest Common Tiling"
tags: [math, arithmetic, SoME]
related_posts:
  - computing-bezout-coefficients
_styles: >
  /* screenshots: a bit narrower than the text column, centered */
  .post-figure {
    display: block;
    width: 80%;
    height: auto;
    margin: 0 auto;
  }

  /* tables: centered as a block, with centered cells */
  #markdown-content table {
    width: auto;
    margin: 1.75rem auto;
    border-collapse: collapse;
  }
  #markdown-content table th,
  #markdown-content table td {
    padding: 0.4rem 1.5rem;
    text-align: center;
    border: none;
    font-variant-numeric: tabular-nums;
  }
  #markdown-content table thead th {
    font-weight: 600;
    white-space: nowrap;
    border-bottom: 1px solid var(--global-divider-color);
  }
  #markdown-content table tbody tr:not(:last-child) td {
    border-bottom: 1px solid var(--global-divider-color);
  }

  /* highlighted boxes for definition / lemma / proof */
  .callout {
    background-color: rgba(42, 120, 214, 0.08);
    border: 1px solid rgba(42, 120, 214, 0.22);
    border-left: 3px solid #2a78d6;
    border-radius: 6px;
    padding: 1rem 1.25rem;
    margin: 1.75rem 0;
  }
  .callout-proof {
    background-color: rgba(42, 120, 214, 0.04);
  }
  .callout > :first-child {
    margin-top: 0;
  }
  .callout > :last-child {
    margin-bottom: 0;
  }
  html[data-theme="dark"] .callout {
    background-color: rgba(57, 135, 229, 0.13);
    border-color: rgba(57, 135, 229, 0.3);
    border-left-color: #3987e5;
  }
  html[data-theme="dark"] .callout-proof {
    background-color: rgba(57, 135, 229, 0.07);
  }

  @media (max-width: 600px) {
    .post-figure {
      width: 100%;
    }
    #markdown-content table th,
    #markdown-content table td {
      padding: 0.35rem 0.7rem;
    }
  }
---

This is my entry for the 2026 edition of [SoME](https://some.3b1b.co).

---

Imagine this: I just moved to a new flat, it's a great place overall, but there is one small issue; The bathroom floor needs a new tiling.

I got the dimensions of the floor using a tape measure and found it to be 126 cm wide and 231 cm long. To make life easy, I'd prefer to tile it with squares that have a whole number side-length, and ideally, no cutting of tiles, because I don't have the proper tools for that. It's clear that squares of $1$ cm side-length would do the job, but that means I'd have to place down $126 \times 231 = 29\,106$ tiny tiles, so... let's first see if there aren't any larger squares that also work. I'll ask one of the numerous chatbots to help me out:

{% include figure.liquid loading="eager" path="assets/img/some4-tiles-question.png" class="img-fluid rounded z-depth-1 post-figure" alt="A chatbot listing 1, 3, 7, 21, 42 and 63 cm as possible tile sizes for a 126 cm by 231 cm floor, and recommending 42 cm tiles." %}

In true chatbot fashion the answer is not entirely correct: Using 5.5 tiles along the length clearly _does_ require cutting. What a wonderful moment therefore, to remember the mantra which ought to constantly echo in your mind while conversing with any chatbot:

> 🧐 _"How can I verify this?"_

In this case, the chatbot gave us a list of possible common divisors for $126$ and $231$, and fortunately, it's very easy to verify their correctness. For example, we can simply grab a calculator and do the divisions to see if we get a whole number. If we do this, we will find:

| $d$ | $d$ divides 126 | $d$ divides 231 |
| --- | --------------- | --------------- |
| 1   | ✅              | ✅              |
| 3   | ✅              | ✅              |
| 7   | ✅              | ✅              |
| 21  | ✅              | ✅              |
| 42  | ✅              | ❌              |
| 63  | ✅              | ❌              |

As the table shows, it was good to be skeptical. Up to $21$, the listed numbers do divide both, but the last two do not. This also means the response wasn't completely useless either: Since 21 really does divide both lengths evenly, I now know that I can tile the floor with:

- $126 / 21 = 6$ tiles along the width
- $231 / 21 = 11$ tiles along the length

leading to a total of $6 \times 11 = 66$ tiles, which is much more manageable.

# Oh the Irony...

Speaking of making mistakes: After double checking my measurements to make sure that I wouldn't regret ordering wrong tiles, I realized that I actually forgot to account for the length of the body of the tape measure I used... 🤦‍♂

{% include figure.liquid path="assets/img/some4-tiles-coprime.png" class="img-fluid rounded z-depth-1 post-figure" alt="The chatbot replying that the greatest common divisor of 131 and 236 is 1, so no larger square tile fits both dimensions without cutting." %}

Oh, that's ehh... less than ideal. The above tells us that $a = 131$ and $b = 236$ don't share any divisors bigger than $1$, which means there is no number $d > 1$ which divides both $a$ and $b$. Let's give number pairs like this a name:

<div class="callout" markdown="1">
**Definition:** Two numbers $a, b$ are called _disjoint_[^disjoint] if there is no divisor $d > 1$ which divides both numbers.
</div>

[^disjoint]: The conventional name for this is [_"coprime"_](https://en.wikipedia.org/wiki/Coprime_integers).

This would spell doom to my weekends, because it would mean that there is no way around the 1cm square tiles. Remember however the echo:

> 🧐 _"How can I verify this?"_

And this time I really want to be sure, because if the answer is incorrect after all, that would be good; There would be some bigger tiles I could use.

Earlier, it was relatively easy to verify the response: We just had to make sure that the relatively short list of (claimed) common divisors was correct. In this case though, verifying that $1$ really is the largest common divisor is going to take a lot more work. One surefire way to settle this is by completely filling the following table:

| $d$ | $d$ divides 131 | $d$ divides 236 |
| --- | --------------- | --------------- |
| 1   | ✅              | ✅              |
| 2   | ❌              | ✅              |
| 3   | ❌              | ❌              |
| 4   | ❌              | ✅              |
| 5   | ❔              | ❔              |
| ... | ...             | ...             |
| 130 | ❔              | ❔              |
| 131 | ❔              | ❔              |

If there is no other row with two checkmarks, then $1$ is indeed the **greatest** common divisor of the two numbers. However, even armed with a calculator it will take quite some time to complete this table.[^1]

[^1]: For the sake of the argument let's pretend that there are no smarter tools than a calculator that we could use. It would of course be very easy to create this table in Excel, or write a very simple program which could quickly deliver the results.

What I would much rather want to do, is to make the chatbot do the work, and then give me something that takes me pretty much no time to check. Kind of like what happened in the first response: I don't know how it produced the list $1, 3, 7, 21, 42, 63$ of possible sizes, but at the very least I could quickly check which ones were correct and which ones were not.

## Time to ponder...

1. In the above table, why did I leave out numbers beyond $d = 131$? Is it not necessary to check them?
2. Since checking that none of the numbers $2, 3, 4, 5, \dots, 131$ divide both $131$ and $236$ by hand sounds like a lot of work, why not ask the chatbot to create a table with that information for us? Wouldn't that allow us to skip the most tedious part (calculating) and just have a look at the results?

---

# Bézout to the rescue

Up to now it seems that in order to verify that $1$ is the only common divisor of $131$ and $236$, we have to do a lot of manual checking. With this in mind, the next thing I'll show you hopefully seems a bit like magic, because knowing about this will save us from doing **all** of that work.

What I will show you is a very innocently looking equation, which nonetheless completely solves our problem. Let's say we happen to have two numbers $x_1, x_2 \in \mathbb{Z}$ such that the following equation holds:

$$
131 \cdot x_1  + 236 \cdot  x_2 = 1,
$$

that is, if we multiply $131$ respectively $236$ with them and add the results up, we get $1$.

What we will now see right away, is that this allows us to immediately conclude that $a$ and $b$ must be disjoint.

<div class="callout" markdown="1">
**Lemma:** If there are $x_1, x_2 \in \mathbb{Z}$ with $a x_1  + b x_2 = 1$, then $1$ is the _only_ common divisor of $a$ and $b$.
</div>

<div class="callout callout-proof" markdown="1">

_Proof:_ Let $d > 0$ be some number which divides both $a$ and $b$. This means there are numbers $a', b'$ such that:

$$
 a = d a' ~~~\text{and}~~~ b = d b'
$$

Because of the equation involving $x_1, x_2$ we then have

$$
d a' x_1 + d b' x_2 = 1
$$

where we can factor out $d$ to get

$$
d \cdot (a' x_1 + b' x_2) = 1.
$$

Since $d > 0$, the only way for this product to equal $1$ is if both of numbers are equal to $1$, so in particular $d = 1$. $\Box$

</div>

This is neat! It tells us that in order to be certain that two numbers are disjoint, it suffices to find (or be given) two special numbers $x_1, x_2$ which satisfy the above equation. Let's put this to the test! We will go ask the chatbot to find numbers like this, which would prove that they are disjoint. And luckily, this time we can easily verify its response.

{% include figure.liquid path="assets/img/some4-bezout-request.png" class="img-fluid rounded z-depth-1 post-figure" alt="The chatbot solving 131a + 236b = 1 with the extended Euclidean algorithm and answering a = -9, b = 5." %}

And indeed! We have that the following equation is satisfied:

$$
- 9 \cdot 131 + 5 \cdot 236 = 1
$$

You also shouldn't believe _me_ either though, check it for yourself!!

And by our earlier lemma then, this conclusively settles that the greatest common divisor of $131$ and $236$ is indeed $1$.

---

# Computing Bézout Coefficients

Above, we saw what to ask for if we want to easily verify someone's claim that two numbers are disjoint. But what if someone wants these coefficients from _us_? How do we go about finding such numbers?

Let's get to how you can actually compute these two numbers yourself.

The algorithm is as follows: We start by writing down two equations $(1)$ and $(2)$ involving the numbers $131$ and $236$. As you can see, equation $(1)$ simply has the number $131$ written on the right side, and a rather obvious way to combine $131$ and $236$ to get $131$ as a result, but that will change soon. Equation $(2)$ is the same, but for $236$.

$$
\begin{array}{rcr}
 1 \cdot 131 + 0 \cdot 236 &=& 131  & (1)\\
 0 \cdot 131 + 1 \cdot 236 &=& 236  & (2)
\end{array}
$$

We now look for the smallest of the two numbers, and subtract its equation from the other one—several times if necessary—until it's smaller. So given the starting equations above, where $131$ is smaller than $236$, we will subtract $(1)$ from $(2)$, and end up with:

$$
\begin{array}{rcr}
 1 \cdot 131 + 0 \cdot 236 &=& 131  & (1)\\
 -1 \cdot 131 + 1 \cdot 236 &=& 105 & (2)
\end{array}
$$

We then repeat this procedure until we hit a point where none of the two numbers can be made smaller anymore. Since $105 < 131$, we now subtract $(2)$ from $(1)$ to get:

$$
\begin{array}{rcr}
 2 \cdot 131 -1 \cdot 236 &=& 26  & (1)\\
 -1 \cdot 131 + 1 \cdot 236 &=& 105 & (2)
\end{array}
$$

This time we can subtract $(1)$ from $(2)$ four times, giving:

$$
\begin{array}{rcr}
 2 \cdot 131 -1 \cdot 236 &=& 26  & (1)\\
 - 9 \cdot 131 + 5 \cdot 236 &=& 1 & (2)
\end{array}
$$

It's clear that we can now use equation $(1)$ to bring down the $26$ to $0$ in equation $(2)$, and at that point no further reductions of the two numbers would be possible. We can already stop here though, because equation $(2)$ won't change any more and it's already giving us exactly what we have been looking for! It reads:

$$
 131 \cdot x_1 + 236 \cdot x_2 = 1
$$

with the already familiar values $x_1 = -9$, $x_2 = 5$.

## Time to ponder...

1. Based on the above, can you find an argument which shows that $1$ is the only common divisor of $26$ and $105$?
2. Are $x_1 = -9, x_2 = 5$ the only values which satisfy the equation $131 \cdot x_1 + 236 \cdot x_2 = 1$ ?
3. Run the above algorithm for the original (incorrect) measurements, meaning with $a = 126$ and $b = 231$. What do you find?
4. We showed how one equation can be used to show that two numbers are disjoint. Is there a way to extend this to three or $n$ numbers?

# In Summary

What have we learned?

- You want to prove that two numbers have a common divisor? Easy! Just name one such divisor and everyone can check for themselves.
- You want to prove that two numbers **do not have any** common divisor? Easy! Just provide Bézout coefficients and everyone can check for themselves.
- Always verify the answers a chatbot gives you.

And now you'll have to excuse me; I have just received a delivery of $30\,916$ tiny bathroom tiles, so I have quite some work ahead of me.

---
