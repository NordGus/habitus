# habitus

A simple habit tracker, built during my first experiment with Claude Code assisted development and hand-refined by a
human to be deployable and maintainable.

## Post Mortem

### El Experimento

Using the Front-End Skill and Superpowers I started by vaguely defining the idea I wanted to explore, the technologies
and services I wanted to integrate to Claude Code while using Sonnet 4.6 with plan mode enabled. Following the
recommendations I've been hearing on podcasts and YouTube. During the entire process Claude suggested additional skills
and only accepted the official ones.

For some time I wanted to implement a simple habit tracking application to make myself more accountable and restore the
healthy habits I've lost with time. I've also been listening a lot about the ease of use that Clerk and Convex give you
to design and serve your application with super ease and real-time capabilities. So I simply asked Claude to plan how to
implement a habit tracker using Svelte, Clerk and Convex, and also added a description of the main feature I had in mind,
that is how the tracker view works and shows your streaks, the rest of the app I left it for the model to decide.

### Apocalipsis (Revelaciones)

Thanks to Superpowers I ended up in a 60-minute brainstorming session with the model on what routes it could take to
implement the idea. Like basic UX ideas, data modeling and general layout. This brainstorming session to me is one of
the best use cases for AI integrations in computing I have experienced, and is also something that I've written about
before, the so-called AI as a revolution in Human Machine interface. It was like I was interacting with the Internet, the
Technical Documentation, the knowledge compressed in the Model's Weights, the tools I selected and my PC; using purely
natural language.

That's literally straight out of The Moon is a Harsh Mistress, a Starfleet's Spaceship, Master Chief Petty Officer
John-117 and Cortana carrying humanity's hope while fighting Space-faring religious Zealots and universe-ending cosmic
horrors. What the current AI narrative should be.

### Mi Doble Digital

Now comes the part a lot of people find crazy but to me it is just the Frontier Laboratories' flexing their research to steer
the compression process of a lot of coding/programming knowledge into the weights of their models. But with some
capabilities that are truly mind-blowing. Implementing the application.

First of all, I'm bankrolling this myself with the cheapest Claude Subscription, Claude Pro. While the entire
brainstorming session only took 42% of the session token limit (a 5-hour rolling window for token consumption)
implementing the plan using a combination of Haiku 4.5 and Sonnet 4.6 took 2 5-hour session blocks where the limits were
reached in 20~40 minutes.

The result looked good, something between what I know this type of code could look like and my actual skill to write it
from scratch; some awesome patterns, and some caveman stuff I'm working on polishing. Just to find out my idea of using
Clerk and Svelte was problematic. So I asked Claude Code to migrate the UI layer to TanStack Start. It took another 2
5-hour sessions to migrate the code. But the model did it!

It was impressive how it made the migration, especially to such a **newer** pseudo-framework like **TanStack Start** that 
is in release candidate, at the moment of writing. So basically it took Claude Code 2 real-time days and 4 to 5 five-hour
sessions to implement something I wanted to do for some time now. And I like it because I can see what average TanStack
Start production code looks like in a context that I ideated.

Claude was basically my digital twin who is on the verge of an energy-drink-induced overdose. So it takes
1/100th of the time to implement my delirious software ideas. 

### Planeando la revolución lunar con mi amigo Mike

I like that I retained control of architecture, general concept and tech stack of the application; while having the
craziest planning session of my life with my computer, I've experienced the next evolution of machine-human interface.
I'm literally Mannie from The Moon is a Harsh Mistress planning a revolution with my computer buddy Mike.

Superpowers have made Claude Code communicate with me in a way I've been dreaming about implementing in my applications
for the last 2 years. And it was awesome!!!!

I no longer think about code in the same way as before, but I can say that systems design and data modeling are the new
skills I need to focus on to become a better software engineer for this new world. But at the same time I feel lost in
the echo chambers of this AI investor Bubble we are living with.

For my next few projects I will try to make a software factory with multiple agents with other agents code reviewing
the output to attempt at some level of quality control so I can become the mythical 1000000x Engineer for free. Or The
Emperor has no clothes.

> I'm gonna piss off so many CTOs out there, I'll fulfill my dream of becoming unemployable!
>
> Gustavo A. Rodriguez Rivero - April 25th, 2026

## Vercel puede ser un dolor de cabeza si no sabes nada de la plataforma
