<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- App state lives in `src/lib/store.tsx` (browser localStorage) until Lovable Cloud is connected; why: first step needs zero backend.
- Domain logic is split by module in `src/lib/` (csv = collecte, stats, pdf, store = validation/history); why: each can later move server-side independently.
- Probabilities are never displayed until a real model exists (`computeProbabilities` returns null); why: no fictitious figures.
