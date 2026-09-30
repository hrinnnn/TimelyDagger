# TimelyDAgger

**Timing-Aware Expert Querying for VLA Policy Improvement**

[Paper on arXiv](https://arxiv.org/abs/2609.33157) · [Citation](CITATION.bib)

TimelyDAgger combines Bridge-PCA monitoring of internal VLA features with Feedback-guided Threshold Adaptation to improve when robots request expert takeover. Collected successful expert suffixes are used to update the policy under a matched retained expert-action budget.

This repository currently contains the research project page, paper figures, and demonstration videos. Research implementation and checkpoints are not included. The code-release destination is intentionally unset for now.

## Results

- Highest reported post-training success in 13 of 15 evaluated task–backbone settings.
- Real-world cable-insertion success: 60.0% in OOD1 and 26.7% in OOD2.
- See the paper and project page for experimental protocols and sample details.

## Project page

The static website is in `website/`. The GitHub Pages workflow validates and publishes only that directory from `main`. In repository Settings → Pages, select **GitHub Actions** as the source.

For local validation and preview:

```sh
python3 scripts/check_site.py
node --check website/app.js
python3 -m http.server 8766 --directory website
```
