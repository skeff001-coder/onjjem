#!/bin/bash
set -e
<<<<<<< HEAD
pnpm install --frozen-lockfile
pnpm --filter db push
=======

pnpm install

pnpm --filter @workspace/db run push-force
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc
