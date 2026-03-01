HOST: Okay, so imagine you're building an AI assistant, right? And you want it to think through problems step-by-step, show its work, so users can see the reasoning. Sounds great, super transparent.

EXPERT: Yeah, exactly. That's the whole appeal of extended thinking—you get to peek inside the black box.

HOST: Right, right. But then... what happens when the AI's internal monologue starts thinking through, I don't know, how to build a weapon? Or something equally bad?

EXPERT: Oh, that's—yeah, okay, so this is where it gets interesting. You've just described the exact problem that thinking redaction solves.

HOST: Wait, thinking redaction? That sounds very... spy novel.

EXPERT: It kind of is! So here's the thing. When Claude uses this extended thinking feature—which is only in Claude 3.7 Sonnet, by the way—it generates these internal reasoning blocks before giving you the final answer. And most of the time, you can see all of it. But sometimes, the safety systems flag parts of that thinking as potentially harmful.

HOST: So what happens to it?

EXPERT: It gets encrypted. Automatically. The system detects it, encrypts it, and sends it back as what's called a redacted thinking block instead of a normal thinking block.

HOST: Okay but hold on—if it's encrypted, how does the AI still use that reasoning? Like, doesn't it need to remember what it was thinking?

EXPERT: Yes! This is the clever part. So the encrypted block—it's just this opaque blob of data to you and me, right? We can't decrypt it. But when you send it back to the API in the next request, Anthropic's servers decrypt it on their end. So Claude maintains continuity, remembers the full reasoning chain, but the user never sees the dangerous parts.

HOST: Huh. That's... actually kind of elegant? It's like the AI can still think the thought, it just can't say it out loud.

EXPERT: Exactly. And this is crucial for multi-turn conversations, especially when you're using tool use. Because if Claude is reasoning through something that requires multiple steps—like, it thinks, then calls a tool, then thinks some more—you have to pass those thinking blocks back. Otherwise the whole context falls apart.

HOST: Right, right, right. So you're basically saying the AI needs its own notes, even the redacted ones.

EXPERT: Yeah, exactly. And here's where developers sometimes run into trouble. You have to pass those blocks back exactly as you received them. No modifications. Because they're cryptographically signed.

HOST: Wait, signed? Like a certificate?

EXPERT: Yeah. Each thinking block comes with this signature field—it's this big cryptographic token. And the API won't accept the block back unless the signature matches. So you can't edit it, you can't summarize it, you can't do anything. It has to be bit-for-bit identical.

HOST: Okay, so let me make sure I'm following. The AI thinks. Sometimes those thoughts get flagged and encrypted. You can't read the encrypted parts, but you have to send them back anyway so the AI stays on track. And if you mess with them, the whole thing breaks.

EXPERT: Yep. That's it.

HOST: That feels like a lot of trust. Like, how do I know what's in there?

EXPERT: You don't. And that's by design. The whole point is that some reasoning is too dangerous to expose, but still functionally necessary for the model to do its job well.

HOST: Hmm. I mean, I get it, but it's a little unsettling, right? Like, there's this part of the AI's brain I just can't see.

EXPERT: Oh, totally. And Anthropic is actually pretty upfront about this. They even acknowledge that the visible thinking might not perfectly represent what's actually happening internally. Like, the model might make decisions based on factors that don't show up in the thinking output.

HOST: Wait, really? So even the stuff I can see might not be the whole story?

EXPERT: Correct. They call it the "faithfulness" problem. The thinking you see is generally accurate, but it's not a perfect transcript of the model's internal state.

HOST: That's... okay, that's kind of wild. So we're getting transparency, but with an asterisk.

EXPERT: Yeah. But here's the thing—this trade-off makes sense when you think about the alternative. Would you rather have full transparency and risk exposing dangerous reasoning? Or accept some opacity in exchange for safety?

HOST: I mean, when you put it that way... yeah, okay. Safety wins. But it does make me wonder—what kind of stuff actually triggers this? Like, what counts as too dangerous to show?

EXPERT: So the documentation mentions things like child safety, cyber attacks, dangerous weapons. Basically, topics where even the reasoning process could be harmful if someone read it and thought, "Oh, I could use this."

HOST: Right. So it's not just about the final answer being bad—it's about the thinking itself being a how-to guide.

EXPERT: Exactly. And here's a fun detail—there's actually a magic string you can use to test this in your own application.

HOST: A magic string? What, like a cheat code?

EXPERT: Kind of, yeah! It's this long cryptographic-looking string that, if you send it as a prompt, it'll trigger a redacted thinking block. So you can test whether your code handles it correctly without actually asking about dangerous stuff.

HOST: That's brilliant. Because otherwise you'd have to, like, ask the AI how to commit a crime just to see if your error handling works.

EXPERT: Right. Which would be both unethical and also probably get you flagged by the safety systems in a different way.

HOST: Okay, so we've got thinking redaction. The AI can think dangerous thoughts, but we encrypt them. Cool. But that's only half the safety story, right? Because we also have to worry about what the AI actually does.

EXPERT: Oh, yeah. This is where we get into autonomy versus safety. And this is—okay, this is one of the hardest problems in AI deployment right now.

HOST: How so?

EXPERT: Alright, so think about it. The whole point of an AI agent is that it can do stuff autonomously. Book a meeting, send an email, approve a refund, whatever. But if you require human approval for every single action, you've basically just built a very expensive suggestion box.

HOST: Ha! Yeah, that's fair.

EXPERT: But if you don't require any approval, you've got an AI that could, I don't know, accidentally delete your production database. Or send a confidential email to the wrong person. Or approve a million-dollar transaction.

HOST: Okay, yeah, I see the problem. You need autonomy to make it useful, but autonomy is also terrifying.

EXPERT: Exactly. And this is so important that OWASP—the organization that tracks security vulnerabilities—made "Excessive Agency" one of their top 10 risks for AI applications.

HOST: Wait, OWASP? Like the web security people?

EXPERT: Yeah, same folks who do the OWASP Top 10 for web apps. They have a separate list for LLM applications now, and Excessive Agency is number six.

HOST: So what counts as excessive agency?

EXPERT: Three things, basically. Excessive functionality—the AI has tools it doesn't actually need. Excessive permissions—it's running with way more access than necessary. And excessive autonomy—it's making high-impact decisions without any verification.

HOST: Okay, so it's like... the AI equivalent of giving someone root access when they only need to read a log file.

EXPERT: Yes! It's the principle of least privilege, but applied to AI agents. And the scary part is how easy it is to mess this up. Like, you spin up an AI agent, you give it access to your calendar, your email, your CRM, and suddenly it's operating with the combined permissions of like five different systems.

HOST: Oh god. Yeah, I can see how that gets out of hand fast.

EXPERT: And here's the other thing—a lot of enterprise agents run under service accounts rather than individual user credentials. So now you've got an AI operating with shared, high-privilege access, and the audit trail doesn't even show who actually initiated the action.

HOST: That's bad.

EXPERT: That's really bad. Because if something goes wrong, you can't even trace it back.

HOST: So what's the fix? Like, how do you make this safe without losing all the benefits?

EXPERT: The answer is risk-based calibration. You don't treat every action the same. Some things get automatic approval, some things require human confirmation, and you decide based on the risk.

HOST: Okay, give me examples.

EXPERT: Sure. So, reading a document? Probably fine, auto-approve. Sending a routine internal email? Maybe auto-approve, depending on your setup. But deleting customer data? Definitely needs confirmation. Approving a refund over a certain amount? Confirmation. Changing production system access? Hard confirmation.

HOST: That makes sense. But how do you actually build this? Like, technically?

EXPERT: So most modern frameworks have this built in now. LangGraph, OpenAI's Agents SDK, Amazon Bedrock Agents—they all have what's called "human-in-the-loop" patterns.

HOST: Human-in-the-loop. Okay.

EXPERT: Yeah. The idea is that the agent's execution can pause at certain points, wait for human input, and then resume. So you can mark specific tools or actions as requiring approval, and when the agent tries to use them, it stops and asks.

HOST: So it's like a checkpoint system.

EXPERT: Exactly. And in something like the OpenAI Agents SDK, you can even make it conditional. Like, send an email normally doesn't need approval, but send an email if the subject line contains "CONFIDENTIAL"—that needs approval.

HOST: Oh, that's smart. So you're not just saying yes or no to entire categories, you're looking at the actual context.

EXPERT: Right. And when the agent pauses, the human can do one of three things: approve it, edit it, or reject it.

HOST: Edit it?

EXPERT: Yeah. Like, maybe the AI wants to send an email, but the tone is a little off. You can modify the message and then approve the modified version.

HOST: Huh. Although that seems dangerous, right? Like, what if you edit it in a way that confuses the AI?

EXPERT: Oh, you're ahead of me. Yeah, there's actually a gotcha in the LangChain docs about this. If you make significant modifications to the arguments, it can cause the model to re-evaluate and potentially execute the tool multiple times.

HOST: Wait, so you could accidentally trigger it twice?

EXPERT: Yeah. So editing is powerful, but you have to be careful.

HOST: Okay, so we've got this approval workflow. But what about things that take a long time? Like, what if I need to wait for my manager to approve something, and they're out for the day?

EXPERT: Good question. So you can set timeouts and save the state. The OpenAI SDK lets you serialize the agent's state—basically save it to a database—and then resume it later. Even days later.

HOST: So you could have, like, a queue of pending approvals that people work through.

EXPERT: Exactly. And you can configure things like escalation. If nobody approves within four hours, escalate to a different person. Or if it's been 24 hours, just cancel the whole thing.

HOST: That's pretty sophisticated. I'm guessing you need audit trails for all this too.

EXPERT: Oh yeah, absolutely. Every approval decision should be logged. Who approved it, when, why. Immutable records. Because if something goes wrong, you need to be able to reconstruct what happened.

HOST: Right, right. Okay, so we've got thinking redaction on one side—controlling what the AI thinks about. And we've got human-in-the-loop on the other side—controlling what it does. These feel like two totally different safety mechanisms.

EXPERT: They are. But they're both trying to solve the same underlying problem, which is: how do you get the benefits of AI reasoning and autonomy without the risks?

HOST: Yeah. And it seems like the answer in both cases is selective transparency and selective control.

EXPERT: Exactly. You don't need to see all the thinking, and you don't need to approve all the actions. You just need to intervene at the right points.

HOST: But how do you know what the right points are?

EXPERT: That's the million-dollar question. And honestly, it depends on your use case. Like, what's risky for a customer service bot is different from what's risky for a financial trading agent.

HOST: Right. Although I imagine there are some universal guidelines.

EXPERT: Yeah. Reversibility is a big one. If an action is reversible, it's lower risk. Like, scheduling a meeting—you can always cancel it. But deleting a database record? That's permanent.

HOST: Unless you have backups.

EXPERT: Well, sure. But then you're relying on your backup strategy. It's not truly reversible in the same way.

HOST: Fair point. What else?

EXPERT: Harm severity. Obviously, the worse the potential outcome, the more oversight you need. And user expertise—like, if you're an expert user who understands the system, maybe you need less hand-holding.

HOST: So it's not just about the action, it's about the context.

EXPERT: Exactly. And system maturity, too. When you first deploy an agent, you probably want more oversight. As it proves itself over time, you can relax some of the controls.

HOST: That makes sense. Start cautious, get more confident.

EXPERT: Yeah. Although you have to be careful not to get too confident. Because there's this whole category of attack that targets the human-in-the-loop mechanism itself.

HOST: Wait, what? I thought human-in-the-loop was the safety mechanism.

EXPERT: It is. But it's not invulnerable. There's something called a "Lies-in-the-Loop" attack, or LITL.

HOST: Okay, that's an amazing name. What is it?

EXPERT: So the idea is this: the attacker doesn't need to bypass the approval system. They just need to manipulate what the human sees when they're making the approval decision.

HOST: Oh. Oh no.

EXPERT: Yeah. Like, imagine the AI presents you with a confirmation dialog: "Do you want to send this email to Bob?" And you approve it. But what actually gets sent is completely different, because the attacker manipulated the preview.

HOST: That's... wow. So the human thinks they're providing meaningful oversight, but they're actually rubber-stamping something they never saw.

EXPERT: Exactly. And this is why you can't just bolt on a confirmation dialog and call it safe. You need to make sure that what's being presented for approval is actually what's going to be executed.

HOST: Okay, so how do you defend against that?

EXPERT: Complete mediation. You implement authorization at the execution point, not at the presentation layer. So even if the attacker manipulates the dialog, the downstream system still enforces access control.

HOST: So defense in depth.

EXPERT: Yeah. Never rely on a single layer of protection.

HOST: This is making me realize how much trust is baked into these systems. Like, we're trusting the AI to present accurate information. We're trusting the framework to enforce approvals correctly. We're trusting that the encrypted thinking is actually what it says it is.

EXPERT: Yeah. And that's why transparency is so important. Although, here's a depressing stat: according to a 2025 survey of deployed AI agents, 25 out of 30 agents disclosed no internal safety results. And 23 out of 30 had no third-party testing information.

HOST: Wait, seriously?

EXPERT: Yeah. So most deployed agents, we just don't know how safe they actually are. It's trust all the way down.

HOST: That's... not great.

EXPERT: No. And it gets worse. The same survey found that 4 out of 30 agents don't even have documented stop options.

HOST: Meaning you can't shut them down?

EXPERT: Meaning there's no reliable way to halt execution if things go wrong. Which is insane, right? Like, the first thing you should build into an autonomous system is a big red stop button.

HOST: Yeah, that seems like Safety 101.

EXPERT: You would think. But it's not universal. And that's concerning, especially as these agents get more capable.

HOST: Okay, so we've got gaps in transparency, gaps in shutdown mechanisms. What else should people be worried about?

EXPERT: Billing surprises, actually.

HOST: Billing? That's a safety issue?

EXPERT: Well, it's not a safety issue in the traditional sense, but it catches people off guard. With extended thinking, you're billed for the full thinking tokens, not just what you see.

HOST: Oh. So if half of the thinking is redacted, I'm still paying for all of it?

EXPERT: Yep. And with Claude 4 models, it's even trickier because they return summarized thinking. So the visible token count doesn't match the billed output tokens.

HOST: Wait, so I could see, like, 500 tokens of thinking summary, but actually be billed for 5,000 tokens?

EXPERT: Potentially, yeah. The summary is much shorter than the actual thinking that happened.

HOST: Huh. That's good to know. Although I guess it makes sense—the work still got done, even if I'm only seeing the cliff notes.

EXPERT: Right. But it's one of those things where if you're not expecting it, your AWS bill gets weird.

HOST: Ha, yeah. Okay, so let me try to synthesize this. We've got these two big safety mechanisms. Thinking redaction, which controls the reasoning we see. And human-in-the-loop, which controls the actions the AI takes. And both of them are about finding the right balance.

EXPERT: Exactly.

HOST: Because too much control and you lose the benefits. Too little control and you lose sleep at night worrying about what your AI is doing.

EXPERT: Yeah. And the calibration is hard because it's context-dependent. There's no universal setting.

HOST: Right. Although it sounds like the frameworks are getting better at making this easier to implement.

EXPERT: They are. Like, five years ago, you would have had to build all of this from scratch. Now it's mostly configuration.

HOST: So what's still hard?

EXPERT: Knowing what to configure. Like, deciding which actions are risky, how long timeouts should be, whether to allow editing or just approve/reject. Those are judgment calls.

HOST: And presumably they depend on the domain, the users, the stakes.

EXPERT: Yeah. A customer service agent has different risk profiles than a financial trading agent. Or a healthcare agent. Or a code deployment agent.

HOST: Right, right. And I'm guessing the regulations are going to start catching up too. Like, we'll probably see compliance requirements around this stuff.

EXPERT: Oh, for sure. Especially in regulated industries like healthcare and finance. I would not be surprised if we see mandatory human-in-the-loop requirements for certain types of decisions.

HOST: Yeah. Although that raises the question—if you're required to have human approval, are you really using AI autonomy anymore? Or are you just using a very expensive recommendation engine?

EXPERT: That's the tension, right? And I think the answer is that it depends on how you structure the approval. If the human is just rubber-stamping everything, then yeah, it's theater. But if the human is providing genuine oversight at critical decision points, and the AI is handling everything else autonomously, then you're still getting value.

HOST: So it's about choosing the right checkpoints.

EXPERT: Exactly. And making sure those checkpoints are actually meaningful, not just CYA.

HOST: Okay, last question. Where is this all headed? Like, do you think we're going to get better at this, or is it always going to be this tightrope walk between autonomy and safety?

EXPERT: I think we're going to get better tools, but the fundamental tension isn't going away. Because at the end of the day, you're trying to deploy a system that makes decisions, and decisions have consequences.

HOST: Right.

EXPERT: So the question is always: who's accountable when things go wrong? And the answer can't be "the AI," because the AI doesn't have skin in the game. It's always going to be a human or an organization.

HOST: So these safety mechanisms are really about making sure the humans stay in the loop in the ways that matter.

EXPERT: Yeah. And being honest about the risks. Like, thinking redaction is not perfect. Human-in-the-loop is not perfect. But they're both better than the alternative, which is just hoping for the best.

HOST: Hope is not a strategy.

EXPERT: Exactly. And I think as these systems get more powerful and more widely deployed, we're going to see a lot more emphasis on things like audit trails, rollback mechanisms, and sandboxing.

HOST: Treating AI agents like we treat other critical infrastructure.

EXPERT: Yeah. Because that's what they're becoming. When an AI agent has access to your CRM, your email, your financial systems—it's infrastructure. It's not a toy.

HOST: And infrastructure needs safety rails.

EXPERT: Always. Although here's the thing that keeps me up at night: the survey I mentioned earlier, where most agents don't publish safety testing results? That's happening now, while these systems are still relatively limited. What happens when they're way more capable and we still have the same transparency gaps?

HOST: Yeah. That's... that's a good question. And kind of a scary one.

EXPERT: Right. So I think the message for anyone building or deploying these systems is: take safety seriously now. Build in the approval workflows, the audit trails, the shutdown mechanisms. Because it's a lot harder to retrofit safety than to build it in from the start.

HOST: And don't trust that just because a framework has a human-in-the-loop feature, it's automatically safe.

EXPERT: Exactly. You have to actually think through the risks, configure the system appropriately, test it, and monitor it in production.

HOST: And be honest about what you don't know.

EXPERT: Yeah. That faithfulness problem with thinking—like, we don't fully understand what's happening inside these models. And that's okay, as long as we're honest about it and we build in safeguards accordingly.

HOST: Right. Assume there might be surprises, and plan for them.

EXPERT: Yeah. Defense in depth, reversibility by design, and never assume anything is foolproof.

HOST: Okay. This has been kind of sobering, but also really clarifying. Like, I feel like I understand the trade-offs better now.

EXPERT: Good. Because that's the key thing—understanding that there are trade-offs, and being intentional about how you make them.

HOST: Rather than just letting defaults decide for you.

EXPERT: Exactly. Because the defaults might not match your risk tolerance or your use case.

HOST: And if you get it wrong, the consequences are real.

EXPERT: Yeah. Whether that's exposing dangerous reasoning, or having an AI accidentally delete something important, or just eroding user trust because the system behaves unpredictably.

HOST: Trust is fragile.

EXPERT: Very fragile. And easy to lose, hard to rebuild.

HOST: Alright. So if people take one thing away from this, what should it be?

EXPERT: Safety and autonomy are not opposites. They're both necessary, and you can have both if you're thoughtful about where and how you apply controls. Don't skip the hard work of figuring out what's risky and what's not. And test your assumptions, because what you think is safe might not be.

HOST: And maybe check if your AI agent has a stop button.

EXPERT: Ha! Yeah, that too. Definitely that too.