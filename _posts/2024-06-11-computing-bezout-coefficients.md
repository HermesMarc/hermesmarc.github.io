---
layout: post
date: 2024-06-11
title: "Conveniently computing Bézout Coefficients"
tags: [math, arithmetic, algorithm]
related_posts: []
---

If you had some courses in mathematics you will probably have 
encountered the following at some point:

$$
 \text{(Bézout's Identity)}~~~~\forall a,b \; \, \exists y_1,y_2.\;\; y_1a +y_2b = \mathsf{gcd}(a,b)  
$$

Any introductory course on algebra or number theory usually includes a section about modular arithmetic, where the identity pops up as a straightforward way to determine the multiplicative inverse of any element $$x \in \mathbb{Z}_n$$. 
If $$\mathsf{gcd}(x,n) = 1$$ then the identity provides us with Bézout coefficients $$y_1, y_2$$ satisfying

$$
	y_1 x + y_2 n = \mathsf{gcd}(x,n)=1
$$

for which then clearly $$y_1 x = 1 \!\!\! \mod \! n$$. 
Another critical use-case is usually encountered when constructing solutions in the [Chinese Remainder Theorem](https://en.wikipedia.org/wiki/Chinese_remainder_theorem).

While this shows the usefulness of the Bézout coefficients, it tends to be a bit tedious to actually compute them. 
In lectures you are usually first thaught how to compute the gcd of two numbers by using the [Euclidean algorithm](https://en.wikipedia.org/wiki/Euclidean_algorithm), which turns out to be quite simple.
But to then compute the Bézout coefficients this algorithm gets extended in a way that forces us to keep track of all intermediary results and to reversely substitute them later. 
This is known as the [extended Euclidean algorithm](https://en.wikipedia.org/wiki/Extended_Euclidean_algorithm).
Maybe an example is in order to illustrate this; so let's compute the gcd of $$28$$ and $$23$$ and find Bézout coefficients for them. 
We first run the Euclidean algorithm and keep track of all the intermediary equations:

$$
\begin{align*}
    28 &= 1 \cdot 23 + 5 \\
    23 &= 4 \cdot 5 + 3 \\
    5 &= 1 \cdot 3 + 2 \\
    3 &= 1 \cdot 2 + 1 \\
    2 &= 2 \cdot 1 + 0
\end{align*}
$$

We stop once we reach a remainder of $$0$$, knowing that the gcd is given by the last non-zero remainder. 
So in this case we can conclude that $$\mathsf{gcd}(28, 23) = 1$$.
In order to get the Bézout coefficients we take all except the last equation, and rewrite them in such a way that the remainders end up isolated on one side:

$$
\begin{align*}
    28 - 1 \cdot 23 &= 5 \\
    23 - 4 \cdot 5 &= 3 \\
    5 - 1 \cdot 3 &= 2 \\
    3 - 1 \cdot 2 &= \mathsf{gcd}(28, 23)
\end{align*}
$$

Now we eliminate $$2$$ in the last equation by substituting the expression we found in the equation above it:

$$
\begin{array}{rclcrl}
    28 - 1 \cdot 23 &=& 5 & &  28 - 1 \cdot 23 &=& 5 \\
    23 - 4 \cdot 5 &=& 3  & & 23 - 4 \cdot 5 &=& 3 \\
    5 - 1 \cdot 3 &=& 2  & & & \\
    3 - 1 \cdot (5 - 1 \cdot 3) &=& \mathsf{gcd}(28, 23) 
    & \longrightarrow & 
    2 \cdot 3 - 1 \cdot 5 &=& \mathsf{gcd}(28, 23)
\end{array}
$$

Now eliminate $$3$$:

$$
\begin{array}{rclcrl}
    28 - 1 \cdot 23 &=& 5 & &  28 - 1 \cdot 23 &=& 5 \\
    23 - 4 \cdot 5 &=& 3  & & & & \\
    2 \cdot (23 - 4 \cdot 5) - 1 \cdot 5 &= \mathsf{gcd}(28, 23)
    & \longrightarrow & 
    2 \cdot 23 - 9 \cdot 5 &= \mathsf{gcd}(28, 23)
\end{array}
$$

And finally, eliminate $$5$$:

$$
\begin{array}{rclcrl}
    28 - 1 \cdot 23 &=& 5 & & & & \\
    2 \cdot 23 - 9 \cdot (28 - 1 \cdot 23) &=& \mathsf{gcd}(28, 23) 
    & \longrightarrow & 
	 11 \cdot 23 - 9 \cdot 28 = \mathsf{gcd}(28, 23)
\end{array}
$$

Thus we can read off the Bézout coefficients $$y_1 = -9$$ and $$y_2 = 11$$. 
As you can imagine this whole process can become quite tedious if the number of intermediary steps grows, and based on hands on experience as a student, I can assure you that the substitution and subsequent simplification steps are quite error prone when executed on paper.

# A Better Way

Here is a more convenient and direct way to compute the Bézout coefficients (known as *Blankinship's algorithm* [1]). 
We start with an [augmented matrix](https://en.wikipedia.org/wiki/Augmented_matrix), similar to what we would do when computing the inverse of a matrix $$A$$ using the [Gauss-Jordan elimination](https://en.wikipedia.org/wiki/Gaussian_elimination#Finding_the_inverse_of_a_matrix).

$$
\begin{bmatrix}
\begin{array}{cc|c}	
	1 & 0 & 28 \\
	0 & 1 & 23
\end{array}
\end{bmatrix}
$$

The left side is initialized as the identity matrix, and the right most column contains the numbers for which we want to compute the gcd. 
Next, we will focus on executing elementary row operations which have to the effect that they execute the reduction steps of the Euclidean algorithm.
Crucially however, we apply these row operations to the whole augmented matrix!
If we let $$\rho_i$$ stand for the $$i$$-th row, then the first step of executing the algorithm looks like this:

$$
\begin{bmatrix}
\begin{array}{cc|c}	
  1 & 0 & 28 \\
  0 & 1 & 23
\end{array}
\end{bmatrix}
=
\begin{bmatrix}
\begin{array}{cc|c}	
  1 & 0 & 1 \cdot 23 + 5 \\
  0 & 1 & 23
\end{array}
\end{bmatrix}
\stackrel{\rho_1 - 1 \cdot \rho_2}{\longrightarrow}
\begin{bmatrix}
\begin{array}{cc|c}	
  1 & -1 & 5 \\
  0 & 1 & 23
\end{array}
\end{bmatrix}
$$

And repeating this until one of the entries in the last column is $$0$$, we get: 

$$
\begin{align*}
  \begin{bmatrix}
  \begin{array}{cc|c}	
    1 & -1 & 5 \\
    0 & 1 & 23
  \end{array}
  \end{bmatrix}
  \longrightarrow
  \begin{bmatrix}
  \begin{array}{cc|c}	
    1 & -1 & 5 \\
    -4 & 5 & 3
  \end{array}
  \end{bmatrix}
  \longrightarrow
  \begin{bmatrix}
  \begin{array}{cc|c}	
    5 & -6 & 2 \\
    -4 & 5 & 3
  \end{array}
  \end{bmatrix}
  \longrightarrow
  \begin{bmatrix}
  \begin{array}{cc|c}	
    5 & -6 & 2 \\
    -9 & 11 & 1
  \end{array}
  \end{bmatrix}
  \longrightarrow
  \begin{bmatrix}
  \begin{array}{cc|c}	
    23 & -28 & 0 \\
    -9 & 11 & 1
  \end{array}
  \end{bmatrix}
\end{align*}
$$

You might have spotted that the previously computed Bézout coefficients $$y_1 = -9$$ and $$y_2 = 11$$ ominously appear in our end-result! 
This is no mere coincidence!
By the above computation we actually know that the following equation holds:

$$
\begin{bmatrix}
\begin{array}{cc}	
	23 & -28 \\
	-9 & 11
\end{array}
\end{bmatrix}
\begin{bmatrix}
	28 \\ 23
\end{bmatrix}
= 
\begin{bmatrix}
	0 \\ 1
\end{bmatrix}
$$

Which is simply matrix notation summarising the following two equations:

$$
\begin{array}
	{} 23 \cdot 28 - 28 \cdot 23 &=& 0 \\
	- 9 \cdot 28 + 11 \cdot 23 &=& 1
\end{array}
$$

the last of which is our desired Bézout identity. Note that we did not have to do any tedious reverse substitutions or similar things! 
The coefficients were simply computed along the way.


# Why it works

The above works no matter which numbers we put into the last column of the augmented matrix: 
At the end of the computation for the gcd, one of the rows on the left of the augmented matrix will always contain the Bézout coefficients.
But why does it actually work? In order to justify this, we will prove the following result:

**Theorem.** For any $$a, b$$ there is an invertible integer matrix $$R$$ such that

$$
  R
  \begin{bmatrix}
    a \\ b
  \end{bmatrix}
  = 
  \begin{bmatrix}
    \mathsf{gcd}(a,b) \\ 0
  \end{bmatrix}
$$

*Proof.* We will do a proof by induction on the product $$n = \min(a,b)$$. 
If $$n = 0$$ then one of the two numbers must already be $$0$$; 
let's say $$a = 0$$ (the other case is similar). We then have

$$
\begin{bmatrix}
\begin{array}{cc}	
	0 & 1 \\
	1 & 0 
\end{array}
\end{bmatrix}
\begin{bmatrix}
	 0 \\ b
\end{bmatrix}
= 
\begin{bmatrix}
	 b \\ 0
\end{bmatrix}
= 
\begin{bmatrix}
	 \mathsf{gcd}(0, b) \\ 0
\end{bmatrix}
$$

So assume $$n > 0$$. We may assume that $$a < b$$ (the cases $$a = b$$ 
and $$b < a$$ are either easy or similar). So by division with remainder 
we get some $$q, r$$ such that $$b = q a + r$$ and $$r < a$$. 
Note that by basic properties of the gcd we then have 
$$\mathsf{gcd}(a, b) = \mathsf{gcd}(a, r)$$. We also have

$$
	\min(a, r) = r < a = \min(a, b) = n
$$

So by strong induction there is an invertible matrix $$R'$$ with

$$
R'
\begin{bmatrix}
	 a \\ r
\end{bmatrix}
= 
\begin{bmatrix}
	 \mathsf{gcd}(a,r) \\ 0
\end{bmatrix}
$$

But now note that 

$$
\begin{bmatrix}
	 \mathsf{gcd}(a,b) \\ 0
\end{bmatrix}
=
\begin{bmatrix}
	 \mathsf{gcd}(a,r) \\ 0
\end{bmatrix}
=
R'
\begin{bmatrix}
	 a \\ r
\end{bmatrix}
=
R'
\begin{bmatrix}
\begin{array}{cc}	
	1 & 0 \\
	-q & 1 
\end{array}
\end{bmatrix}
\begin{bmatrix}
	 a \\ qa + r
\end{bmatrix}
=
R
\begin{bmatrix}
	 a \\ b
\end{bmatrix}
$$

Where we put

$$
R := R' 
\begin{bmatrix}
\begin{array}{cc}	
	1 & 0 \\
	-q & 1 
\end{array}
\end{bmatrix}
$$

As a product of invertible matrices, $$R$$ is itself invertible, which concludes our induction step. $$\Box$$

The above proof implicitly contains an algorithm to compute the matrix $$R$$, and it's precisely the one I showcased in the earlier example; Start with the extended matrix, execute the Euclidean algorithm on the last column, and once it contains a $$0$$, we know that the left part has the desired matrix $$R$$.

Oh eh... you are still wondering why this is guaranteed to give us the Bézout coefficients? 
Well let's write out the matrix equation as:

$$
\begin{bmatrix}
\begin{array}{cc}	
	R_{11} & R_{12} \\
	R_{21} & R_{22} 
\end{array}
\end{bmatrix}
\begin{bmatrix}
	 a \\ b
\end{bmatrix}
= 
\begin{bmatrix}
	 \mathsf{gcd}(a,b) \\ 0
\end{bmatrix}
$$

The first row corresponds to the equation

$$
	R_{11}a + R_{12}b = \mathsf{gcd}(a,b)
$$

which shows exactly what we wanted!


## Sources

I came across this algorithm [here](https://math.libretexts.org/Bookshelves/Combinatorics_and_Discrete_Mathematics/Elementary_Number_Theory_(Barrus_and_Clark)/01%3A_Chapters/1.10%3A_Computing_Coefficients_for_Bezout's_Lemma), which in turn cites [1] as the earliest know source. 
Quite surprisingly this algorithm is not mentioned at all in the wikipedia article on the [Bézout identity](https://en.wikipedia.org/wiki/B%C3%A9zout's_identity) 
and at most implicitly alluded to in the one on the [extended Euclidean algorithm](https://en.wikipedia.org/wiki/Extended_Euclidean_algorithm#Proof).

## Exercises

1. Show that if there is an invertible integer matrix $$R$$ with $$R \,[\,a ~~ b\,]^t  = [\,g ~~ 0\,]^t$$, then we must have $$g = \mathsf{gcd}(a,b)$$.
2. Use 1. to show that if $$x \in \mathbb{Z}_n$$ is invertible, then $$\mathsf{gcd}(x,n) = 1$$.

---

[1] Blankinship, W. A. "A New Version of the Euclidean Algorithm." _Amer. Math. Monthly_ **70**, 742-745, 1963.
