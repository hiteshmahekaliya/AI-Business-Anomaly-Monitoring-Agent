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

# Architecture notes

- Frontend-only prototype for "AI Business Anomaly Monitoring Agent": no backend, auth, database, or external API calls. All data comes from `src/lib/mock-data.ts` and every demo result must be clearly labeled as demo data in the UI (warning/demo badges).
- The user will integrate a real Python FastAPI backend from VS Code later; keep data shapes in mock-data.ts as the contract and don't introduce other backend stacks.
