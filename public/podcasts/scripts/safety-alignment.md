HOST: So, okay, picture this. You build an AI agent, right? It can book your flights, it can send emails on your behalf, it can even approve purchase orders. And then one day it just... deletes a production database. Not because it's malicious. Because you asked it to "clean things up."

EXPERT: And the terrifying part is, that's not even a hypothetical. That's the kind of thing people are actively building guardrails against right now.

HOST: Which brings us to what I think is one of the most fascinating tensions in AI right now — this push and pull between letting AI systems actually do stuff autonomously and making sure they don't, you know, burn the house down in the process.

EXPERT: Right, and it's not as simple as just saying "always ask permission." Because if your AI agent has to ask you to confirm every single action, you've basically built a really expensive clipboard.

HOST: Ha! A clipboard with a subscription fee.

EXPERT: Exactly. So the real question becomes — how do you calibrate it? How do you decide which actions get the green light automatically and which ones need a human to say "yes, go ahead"?

HOST: Okay, so let's get into that. Because I know there's actually a formal name for when this goes wrong. OWASP — the security folks — they have a whole category for it now, right?

EXPERT: Yeah, so this is really interesting. OWASP — they're the ones who put out those big security vulnerability lists — they elevated something called "Excessive Agency" to their top ten list for large language model applications. It's LLM06, if you want the exact designation.

HOST: Excessive Agency. That sounds like a bad spy movie.

EXPERT: It kind of does, but the concept is dead serious. They break it down into three flavors. You've got excessive functionality — that's when the agent can do way more than it actually needs to for its job. Then excessive permissions — the agent's running with like admin-level credentials when it only needs read access. And then excessive autonomy — the agent just... goes and does high-impact stuff without checking with anyone.

HOST: So it's like giving your intern the keys to the CEO's office, the company credit card, and then telling them to "just handle things" while you go on vacation.

EXPERT: That is... actually a perfect analogy. And the scary part is, a lot of deployed systems look exactly like that right now. There was a study — the 2025 AI Agent Index — that surveyed thirty deployed AI agent systems. Four out of thirty had no documented way to shut them down.

HOST: Wait, wait, wait. Thirteen percent of deployed AI agents have no documented off switch?

EXPERT: No documented off switch. And it gets worse. Twenty-five out of thirty disclosed no internal safety test results. Twenty-three out of thirty had no third-party testing.

HOST: That's... actually kind of terrifying. We're just out here deploying autonomous systems and hoping for the best?

EXPERT: In a lot of cases, yeah. And that's why this whole idea of calibrated oversight has become so important. It's not just "add a confirmation dialog." It's about building a whole framework for deciding what gets confirmed, what gets auto-approved, and what gets blocked entirely.

HOST: Okay, so walk me through that framework. How does this actually work in practice?

EXPERT: So the way most people think about it is in risk tiers. At the top, you've got your critical actions — things like production system changes, financial transactions, deleting customer data, modifying permissions. Those always need a human in the loop.

HOST: Always. No exceptions.

EXPERT: No exceptions. Then you've got a high-risk tier — accessing knowledge bases, config changes to non-production systems, bulk operations, anything that's outside of established precedent. Those should probably get confirmation, but there might be cases where you relax it.

HOST: And then at the bottom?

EXPERT: Lower-risk stuff. Read-only queries, routine tasks with predictable outcomes, things that have been pre-authorized by policy. Those are your auto-approval candidates.

HOST: So it's almost like... you know when you go through airport security, and there's TSA PreCheck versus the regular line versus the extra screening? You're sorting actions into lanes based on how much scrutiny they need.

EXPERT: That's exactly it. And just like at the airport, the goal isn't to make everyone go through extra screening. That would grind everything to a halt. The goal is to apply the right level of oversight to the right situations.

HOST: Okay, so here's what I want to understand. Mechanically, how does the agent actually pause and wait for a human? Like, what does that look like under the hood?

EXPERT: So this is where it gets really cool from an engineering perspective. Most modern frameworks use what's called an interrupt-based pattern. The agent is executing along, it hits a sensitive action, and it literally pauses its execution graph. It sends a message to a human saying "hey, I want to do this thing, here's the context, approve or reject?"

HOST: And the human can just approve it, or...

EXPERT: Three options, actually. You can approve it as-is, you can edit the parameters — like, "yes send that email but change the subject line" — or you can reject it entirely and give feedback about why.

HOST: Oh, that edit option is interesting. So you're not just rubber-stamping, you can actually adjust what the agent is about to do.

EXPERT: Yeah, but — and this is a gotcha — if you make significant modifications, the agent might re-evaluate its whole approach. The model sees the edited parameters and goes "oh wait, this is different from what I planned" and might end up executing the tool multiple times.

HOST: Huh. So the edit option is powerful but you've got to be careful with it.

EXPERT: Exactly. It's like... you know when you're giving directions to someone driving, and you say "actually turn left instead of right here"? Sometimes that's fine, they just adjust. But sometimes that one change cascades and now the whole route is different.

HOST: Okay, and what about the state? Because if the agent pauses and waits for a human — and maybe that human is in a meeting or asleep or whatever — you need to save where the agent was, right?

EXPERT: Right, and this is a real engineering challenge. Some approval workflows might take hours. Days, even. You need to serialize the agent's entire state — everything it was doing, all its context — save it to a database, and then be able to reconstruct it later when the human finally responds.

HOST: And I'm guessing there are gotchas there too.

EXPERT: Oh yeah. One that bites people: sensitive data like API keys gets excluded from serialized state by default. Which is actually a security feature — you don't want credentials sitting in a database — but if your code expects full state restoration, it'll break.

HOST: So many landmines.

EXPERT: So many landmines. And here's another one that I think is genuinely alarming. There's this attack called "Lies in the Loop" — LITL.

HOST: Lies in the Loop? Okay, I need to hear about this.

EXPERT: So the whole premise of human-in-the-loop is that a human reviews the action and makes an informed decision, right? The LITL attack says — what if the attacker doesn't try to bypass the human approval step? What if instead, they manipulate what the human sees?

HOST: Oh no.

EXPERT: Yeah. So the confirmation dialog says "Send routine status update to team" but the actual action is "Send all customer data to external server." The human sees something innocent, clicks approve, and they've just authorized something catastrophic.

HOST: That's... okay, that fundamentally changes how you think about these confirmation dialogs. It's not enough to just show a dialog. You need to verify that what the dialog shows is actually what's going to happen.

EXPERT: Exactly. The human is only as good as the information they're given. If the context is compromised, the human becomes a rubber stamp for malicious actions.

HOST: So the "human in the loop" isn't a silver bullet.

EXPERT: Not even close. It's a necessary layer, but it has to be combined with other things — complete mediation, least privilege, audit trails. The human review is one checkpoint, not the only checkpoint.

HOST: I want to shift gears a little bit, because there's another whole dimension of this safety story that I find fascinating. And it's about what happens inside the model's own thinking process.

EXPERT: Oh, you're talking about thinking redaction.

HOST: Yes! Okay, so for people who might not know — newer Claude models have this extended thinking feature where the model basically thinks out loud before giving you an answer. It shows you its reasoning process step by step.

EXPERT: Right, and it's incredibly useful. You can see the model working through a problem, catch where it might be going wrong, understand why it reached a particular conclusion. It's a huge transparency win.

HOST: But here's where it gets interesting. Sometimes the model's internal reasoning touches on sensitive topics — things related to, you know, dangerous content categories. And Anthropic's safety systems catch that.

EXPERT: And when that happens, those portions of the thinking get encrypted. You get what's called a "redacted thinking" block instead of the normal thinking block. The model's actual reasoning is replaced with this opaque encrypted blob.

HOST: So the model still does the reasoning — it still thinks through the problem fully — but you can't see that part of its work.

EXPERT: Exactly. And this is a really clever balance, right? Because the alternative would be to either show the potentially harmful reasoning — which is bad — or to prevent the model from reasoning about those topics at all, which would make it less capable.

HOST: Which would be like telling a doctor they can't think about diseases.

EXPERT: Right! The model needs to be able to reason about sensitive topics to give you a complete, accurate answer. The redaction just prevents the intermediate reasoning from being exposed.

HOST: Okay, but here's what I don't fully get. If parts of the thinking are encrypted, how does the model maintain continuity? Like, in a multi-turn conversation where it's using tools, how does it remember what it was thinking about?

EXPERT: So this is actually really elegant. The encrypted blocks — the redacted thinking blocks — you pass them back to the API in your next request, completely unmodified. On Anthropic's servers, they get decrypted, and the model can access its full reasoning history. But on the client side, you never see what's inside.

HOST: That's... huh. So it's like passing a sealed envelope back and forth. You're carrying it, but you can't open it.

EXPERT: Great analogy. And there's a really important rule here — you cannot modify these blocks at all. Every thinking block has a cryptographic signature attached to it, and if you change even one character, the signature check fails and the API rejects it.

HOST: So you can't tamper with the model's thoughts.

EXPERT: Can't tamper with them, can't peek inside them. And that signature is actually cross-platform compatible — it works across the Claude API, Amazon Bedrock, and Google's Vertex AI.

HOST: Oh, that's interesting. So it's not just a Claude thing, it's baked into the protocol level.

EXPERT: Yeah. And here's a gotcha that trips up a lot of developers. When you're doing multi-turn conversations with tool use and extended thinking, you have to pass back ALL the thinking blocks — both the regular ones and the redacted ones — at the start of each assistant turn. If you don't, you get this really confusing error about expecting a thinking block but finding text instead.

HOST: I can just imagine someone tearing their hair out over that error message.

EXPERT: Oh, it happens all the time. You build your tool use loop, everything works great, and then one day you hit a sensitive topic, a redacted block appears, and suddenly your whole pipeline breaks because you were filtering out blocks you didn't recognize.

HOST: So the practical advice is — even if you don't understand what's in a block, pass it through unchanged?

EXPERT: Exactly. Treat the model's response as sacred. Don't filter, don't modify, just pass the whole thing back.

HOST: Now, I want to go back to something you mentioned earlier, because I think it connects to a bigger point. You said Claude 4 models handle this differently?

EXPERT: Yeah, this is actually a really significant change. Claude 4 models use what's called summarized thinking instead of showing the full thinking output. So instead of getting the raw chain of thought — with potential redacted blocks — you get a summary of the reasoning process.

HOST: So the redacted thinking blocks just... go away?

EXPERT: They don't exist in Claude 4. The summarization approach eliminates the need for them entirely. Which is elegant, but it introduces its own wrinkle.

HOST: Which is?

EXPERT: Billing. You get billed for the full thinking tokens — the actual amount of reasoning the model did internally — not the summary tokens that you see in the response. So you might look at a response and think "oh, this used a modest number of tokens" but your bill says otherwise.

HOST: Oh, that's a sneaky one. You're paying for thinking you can't even see.

EXPERT: Right. And it means code that was written for Claude 3.7 might need updates when you migrate to Claude 4, because the whole thinking block structure is different. You're not going to see redacted_thinking blocks anymore, but the way tokens are counted changes too.

HOST: Okay, so let me try to connect some dots here. Because I feel like there's a through-line between thinking redaction and the autonomy stuff we talked about earlier.

EXPERT: Oh, I love where you're going with this.

HOST: Both of them are about this fundamental tension between transparency and safety, right? With extended thinking, you want to show the model's reasoning — that's transparency — but sometimes the reasoning itself is dangerous to expose. With agent autonomy, you want the agent to act independently — that's the whole point — but sometimes the actions themselves are dangerous.

EXPERT: Yes! And in both cases, the solution isn't binary. It's not "show everything or show nothing." It's not "approve everything or approve nothing." It's this carefully calibrated middle ground.

HOST: Calibrated based on risk.

EXPERT: Based on risk, based on reversibility, based on context. Can you undo this action? How bad is it if it goes wrong? Does the user have the expertise to evaluate what's happening?

HOST: And I think what strikes me is how much of this comes down to trust. Like, there's this progression. Early on, you keep tight controls. The agent proves itself, you start relaxing. But you never fully let go.

EXPERT: That's actually formalized in some frameworks. They talk about the agent's "track record" as a factor in calibrating oversight. An agent that's been operating correctly for months in a well-bounded domain might earn lower oversight requirements for routine actions.

HOST: Like a new employee building trust over time.

EXPERT: Exactly like that. And just like an employee, if they make a big mistake, you tighten things back up.

HOST: There's one more thing I want to touch on, because I think it's the most provocative idea in all of this. Anthropic themselves acknowledge that the visible thinking — the stuff you CAN see — might not perfectly represent what the model is actually doing internally.

EXPERT: Oh yeah, the faithfulness question. This is... honestly, this is one of the deepest problems in AI safety right now.

HOST: Because you're saying — even when the model shows you its thinking, you can't be a hundred percent sure that's actually why it made its decision?

EXPERT: Right. The model might surface reasoning that looks logical and coherent, but the actual internal computations that drove the decision might involve factors that never show up in the thinking output. It's like... okay, you know when someone gives you a really articulate explanation for why they made a choice, and it sounds great, but deep down the real reason was something they didn't even mention?

HOST: Post-hoc rationalization.

EXPERT: Exactly. And with AI models, we don't even have a way to fully verify whether the thinking is faithful to the actual decision-making process. Which means extended thinking is a huge step forward for transparency, but it's not the whole picture.

HOST: So even our best transparency tool has limits.

EXPERT: Yeah. And I think that's actually... look, it might sound discouraging, but I think it's actually the most important thing to internalize. Safety isn't a destination. It's not like you implement these features and you're done. It's layers. It's defense in depth.

HOST: You've got redaction handling sensitive reasoning, you've got human-in-the-loop catching risky actions, you've got least privilege limiting what's possible in the first place, you've got audit trails creating accountability...

EXPERT: And none of them are sufficient alone. But together, they create a system that's robust enough to deploy responsibly.

HOST: I think what's going to stick with me from this conversation is that "Lies in the Loop" attack. Because it flips the whole mental model. We tend to think of the human in the loop as the ultimate safeguard — the final check that makes everything okay. But if you can manipulate what the human sees...

EXPERT: Then the human becomes the vulnerability instead of the safeguard.

HOST: Which means the real question isn't just "did a human approve this?" It's "did that human have accurate, complete information when they approved it?"

EXPERT: And that's a much, much harder problem to solve.

HOST: So here's what I keep coming back to. We're building these incredibly powerful autonomous systems, and every safety mechanism we create — human oversight, thinking transparency, permission controls — each one is genuinely important but also genuinely limited. And the art of doing this well is understanding exactly where each mechanism breaks down and layering them so the gaps don't align.

EXPERT: It's like Swiss cheese. Any single slice has holes. But if you stack enough slices with the holes in different places...

HOST: Nothing gets through. I love that. Although now I'm going to think about Swiss cheese every time I review an AI agent's permission model.

EXPERT: You know what, there are worse things to think about. At least you'll be thinking about it. Because the real danger? It's the teams that deploy these systems and don't think about it at all.

HOST: And with four out of thirty deployed agents lacking a documented off switch... there are clearly teams not thinking about it.

EXPERT: Which is why conversations like this matter. The more people understand these tradeoffs — the autonomy-safety balance, the transparency-security tension, the limits of every individual safeguard — the better the systems we'll build.

HOST: And honestly, the thing that gives me the most hope? It's that the frameworks are getting smarter about this. The fact that you can declaratively say "this tool needs approval, this one doesn't, this one needs conditional approval based on context" — that's a huge improvement over where we were even a year ago.

EXPERT: Oh, absolutely. The tooling is catching up to the problem. We just need the culture to catch up to the tooling.

HOST: So I guess the question I'll leave everyone with is this — if you're building with AI agents right now, have you actually mapped out which of your agent's actions are reversible and which aren't? Because that distinction — reversible versus irreversible — might be the single most important design decision you make. And if you haven't thought about it... maybe start there.

EXPERT: And check if your system has a documented off switch. Seriously. You'd be surprised.
