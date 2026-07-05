<script setup lang="ts">
const props = defineProps<{
  error: { statusCode?: number; statusMessage?: string }
}>()

function back() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <main class="error-page">
    <p class="t-xl">{{ props.error.statusCode ?? 500 }}</p>
    <p class="t-m t-dim">{{ props.error.statusMessage ?? 'something went wrong' }}</p>
    <button class="link-underline t-s t-accent" @click="back">← back to works</button>
  </main>
</template>

<style scoped>
.error-page {
  display: grid;
  place-content: center;
  gap: var(--gap-s);
  min-height: calc(var(--ivh) * 100);
  text-align: center;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  text-transform: lowercase;
}
</style>
