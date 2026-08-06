<script setup lang="ts">
// Lightweight, dependency-free confetti for the winner reveal. Positions are
// derived from the index (not Math.random) so SSR and client match — no
// hydration mismatch — and it honours prefers-reduced-motion.
const CONFETTI_COUNT = 80
const COLORS = ['#0ca678', '#f08c00', '#2f9e44', '#e8590c', '#f59f00', '#1971c2']

const pieces = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
  left: (i * 37) % 100,
  color: COLORS[i % COLORS.length] ?? COLORS[0],
  delay: (i % 20) * 0.15,
  duration: 3 + (i % 5) * 0.6,
  drift: ((i % 7) - 3) * 10,
}))
</script>

<template>
  <div class="confetti" aria-hidden="true" data-testid="confetti">
    <span
      v-for="(p, i) in pieces"
      :key="i"
      class="piece"
      :style="{
        left: `${p.left}%`,
        background: p.color,
        animationDelay: `${p.delay}s`,
        animationDuration: `${p.duration}s`,
        '--drift': `${p.drift}px`,
      }"
    />
  </div>
</template>

<style scoped>
.confetti {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 50;
}

.piece {
  position: absolute;
  top: -5%;
  width: 0.6rem;
  height: 0.9rem;
  border-radius: 2px;
  opacity: 0.9;
  animation-name: fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes fall {
  0% {
    transform: translateY(-10vh) translateX(0) rotate(0);
  }
  100% {
    transform: translateY(110vh) translateX(var(--drift)) rotate(720deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .piece {
    display: none;
  }
}
</style>
