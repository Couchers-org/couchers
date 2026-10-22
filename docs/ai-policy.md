# Couchers policy for contributions that use AI

*Nomenclature:* "AI" here refers to all of LLMs, coding agents (Claude Code, OpenAI Codex, Pi, OpenCode), other GenAI tools, etc.

## TL;DR

Follow these three principles:

**1. Be forthcoming and honest about your use of AI (and about what your role was).** Disclose when and how you used AI tools, and what you did to steer the tool and confirm its output was correct and sensible. Label all work where AI was used.

**2. Be respectful in communication and carefully digest feedback (and do not use AI in communication).** Never use AI to communicate with others, always write responses to PR reviews, comments, and other discussions by hand. Every PR must include a human written description. Furthermore, when someone writes to you, take the time to digest their message, carefully understand what they say, and incorporate it into your work.

**3. Your contribution must be one of human judgement, synthesis, or creativity; and you must take responsibility for your work.** Given the ease of producing outputs with AI, the value of a contribution must come from human judgement (e.g. deciding which design or approach to go for, verifying that a solution solves a problem), synthesis (understanding, digesting, and interpreting content, such as AI outputs), or creativity (coming up with new ideas about what improves the project). You must always take responsibility for, and ownership of, what you put in front of others, including when you use AI tools to produce it.

*Epilogue.* We are genuinely excited about AI and what it can do for the project and by extension, the couch surfing community. These tools can be phenomenal for setting up and learning the codebase, root causing bugs and implementing new features, and doing many other routine development tasks. Simultaneously, the volume of text produced can be daunting, so we feel these shared rules will make contributing fun and productive for everyone.

We also hope these tools make contributing to Couchers more accessible and that they can bring more people to volunteer for the project: we encourage you to open PRs (including AI assisted ones), and make a contribution!

## Purpose and philosophy

**Purpose.** The purpose of this policy is to set expectations and establish guiding principles for AI usage for contributions to Couchers. We generally believe we can reap significant benefits from AI, and are overall excited about these tools. Simultaneously, they come with their own sharp edges (which we hope to partially mitigate with this policy).

*A tale from the Old World.* In the past, a contributor could pick up an issue, root cause it, fix it, and put up a PR that was 70% there. When a tenured code reviewer saw a thought out PR, it was a strong signal of effort having been exerted, which meant that it often felt worth the effort to guide the new contributor through the process of bringing such a PR to a mergeable state. This helped the contributor learn our processes and standards, while simultaneously affording us an opportunity to evaluate their technical maturity and propensity for joining the team. We generally did this as a "loss leader" to find new volunteers and train junior developers, even though the effort to gently guide such PRs to a mergeable state often took much more technical and emotional labor than it would have taken to fix up the PR directly.

With AI, all of this has been upended. A good looking PR no longer provides meaningful signal of underlying human effort and judgement, a carefully written review does not guarantee the contributor will spend proportionate time understanding and learning our processes, and addressing small bugs or fixing up PRs with AI is now trivial compared to the effort to guide someone through the process. The asymmetry of effort has been flipped: in the past the PR author had to put in significant effort to receive a review that generally took less effort than producing the PR. Now, a conscientious review will always take more time than it takes to produce a low effort PR with a coding agent.

We therefore need to patch the old model to a new world. This document aims to state some clear guidelines on how to use these powerful new tools best, both in terms of what are acceptable uses, as well as how to adjust our existing systems to account for this change.

## Some guiding principles

### 1. Be forthcoming and honest about your use of AI (and about what your role was)

You must be transparent and clear about when, how, and where you use AI, and which pieces of a work are from AI and which are from you. This pre-empts frustration from others trying to guess whether something was done by a human for a reason, or by an AI (for some other kind of reason). It also allows others to form their own opinion about the work and how it was produced, such as whether the judgement for how it was done is sound.

**1a. Clearly mark your AI-assisted PRs and what you did yourself.** Make sure it is clear to the reviewer how AI was used in producing your PR, and what your contribution was.

**1b. Clearly attribute AI-assisted commits.** For commits written via a coding agent, the commit must include a `Co-authored-by` line mentioning the model or the tool.

**1c. PRs produced with AI without clear signals of human effort may be closed without review.** This is simply to guard our time and energy.

**1d. For new contributors: include a sentence describing the extent to which AI was used in your first PRs.**

### 2. Be respectful in communication and carefully digest feedback (and do not use AI in communication)

Communication and working with others is the most important and most fun part of Couchers. With AI, we need to be particularly careful to maintain this dynamic, and make the project a fun thing to spend time on; since AI has a potential to water down human interaction.

All communication between people must be free of AI. When conversing with people, write things yourself. We take this as a basic tenet of respect towards others who are spending their time and effort working with you and often helping you.

When someone puts in this effort to respond to you or give you feedback (including PR feedback), take the time to digest what they meant, why they phrased things the way they did, and what the underlying message is. Make sure you spend proportionate time on a review (or reading a review), and always think about how you can push the PR at hand as close to mergeable as possible to avoid unnecessary rounds of review.

Spend the time to communicate well and clearly, and give people the benefit of the doubt.

**2a. Having to interact with AI against your will is lame and tiring.** Be cautious of this fact, and minimize the amount of AI-generated content that you force others to read.

**2b. Do not relay outputs from AI tools without significant synthesis.** Never copy-paste from an AI tool in a discussion. Always fact-check pertinent information before relying on it and spreading it. You may paraphrase what an AI tool claims, when you feel it is appropriate.

**2c. Do not offload your thinking to AI.** Do not use an AI to synthesise a response or opinion and offer it to others as your own.

**2d. Use the existing PR template and PR agent skills when appropriate.** Your PR may be closed without review otherwise. This standardization makes review easy and includes important sections for you and for reviewers.

**2e. All PRs and issues must contain a human written description (possibly in addition to an AI-produced one).**

**2f. All PR comments, responses, and follow-ups must be human written.**

### 3. Your contribution must be one of human judgement, synthesis, or creativity; and you must take responsibility for your work

Producing plausible looking code used to be both difficult, and also highly correlated to having produced correct and well thought out code. With AI, it is now easy to produce plausible looking code, but it might not be good code doing the right thing. It is therefore as important as ever that we use our human judgement and engineering maturity to produce work that does the right thing, and prove that it does the right thing.

The value of a contribution comes therefore from the human judgement, synthesis, or creativity that went into it, not just the prompting of an AI tool. To be clear: effectively steering an AI tool is an important skill, and this can take judgement and creativity, and be the basis of a contribution.

The core point here is that you must be fully on top of, and own what you do with an AI tool, and you should make this clear and bring it forward when communicating with others. You must carefully digest and verify all AI outputs to make sure they are sound, achieve their purposes in the best way possible, and are free of bugs and issues. This includes understanding the decisions made in your PR (why a technical direction was taken, and how alternatives were balanced), understanding every line of code in your PR, and making sure that it works correctly (including via careful testing).

**3a. You are responsible for your PRs and the technical choices behind them.** You should be able to clearly articulate the direction you took, and why your code achieves the goal in the best way. Why did you pick this architecture, and what were the alternatives you considered?

**3b. You must understand every line of code in your PRs.** You must have read through all the changes in a PR when you open it (as a non-draft PR), and be able to explain everything that it does on the code level.

**3c. AI is not a substitute for expertise and domain knowledge.** Do not use AI to work on parts of the codebase where you are out of your depth and aren't sufficiently familiar with the conventions. Producing such code will cause frustrating reviews or produce more work for others to deal with.

**3d. PRs that take a quick shot at something with AI that a senior dev could easily do better may be closed without review.**

**3e. Carefully test your PRs, and do not leave tests as an afterthought, or expect AI to handle verification.** Pull the branch and manually test your work before releasing a PR. Include real tests in PRs that  actually exercise appropriate behavior (and do not just add code that tests trivially satisfiable predicates).

**3f. AI cannot be held responsible.** You must take responsibility for what you produce with AI. AI cannot be held responsible for bugs, defects, or incidents, so you must take this responsibility and verify that your work is free of issues.

*Please do not use AI to work on this document. Last updated: 2026/09/15.*
