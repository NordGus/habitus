# habitus

A simple habit tracker, built during my first experiment with Claude Code assisted development and hand-refined by a
human to be deployable and maintainable.

## Post Mortem

### El Experimento

Using the Front-End Skill and Superpowers I started by vaguely defining the idea I wanted to explore, the technologies
and services I wanted to integrate to Claude Code while using Sonnet 4.6 with plan mode enabled. Following the
recommendations I've been hearing on podcasts and YouTube. During the entire process Claude recommended me more skills
and only accepted the official ones.

For some time I wanted to implement a simple habit tracking application to make myself more accountable and restore my
healthy habit I've lost with time. I've also have been listening a lot about the ease of use Clerk and Convex give you
to design and serve your application with super ease and realtime capabilities. So I simply asked Claude to plan how to
implement an habit tracker using Svelte, Clerk and Convex, also added a description of the main feature I had in my,
that is how the tracker view works and show your streaks, the rest of the app I left it for the model to decide.

### Apocalipsis (Revelaciones)

Thanks to Superpowers I ended up in a 60 minutes brainstorming session with the model on what routes it could take to
implement the idea. Like basic UX ideas, data modeling and general layout. This brainstorming session to me is one of
the best use cases for AI integrations in computing I have experience, and is also something that I've written about
before, the so call AI as a revolution in Human Machine interface. It was like I was interacting with the Internet, the
Technical Documentation, the knowledge compressed in the Model's Weights, the tools I selected and my PC; using purely
natural language.

That's literally the straight out of The Moon is a Harsh Mistress, a Starfleet's Spaceship, Master Chief Petty Officer
John-117 and Cortana carrying humanity's hope while fighting Space-fairing religious Zealots and universe ending cosmic
horrors. What the current AI narrative should be.

### Mi Doble Digital

Now comes the part a lot people find crazy but to me is just the Frontier Laboratories' flexing their research to steer
the compression process of a lot of coding/programming knowledge into the weights of their models. But with some
capabilities that are truly mind blowing. Implementing the application.

First of all, I'm bank rolling this myself with the cheapest Claude Subscription, Claude Pro. While the entire
brainstorming session only took 42% of the session token limit (a 5 hour rolling window for token consumption)
implementing the plan using a combination of Haiku 4.5 and Sonnet 4.6 took 2 5-hour session blocks where the limits were
reached in 20~40 minutes.

The result looked good, something between what I know this type of code could look like and my actual skill to write it
from scratch; some awesome patterns, and some caveman stuff I'm working on polishing. Just to find out my idea of using
Clerk and Svelte was problematic. So I ask Claude Code to migrate the UI layer to TanStack Start. It took another 2
5-hour sessions to migrate the code. 

It was impressive how it made the migration specially to such a newer pseudo-framework like TanStack Start that is in
release candidate, at the moment of writing. 

