<template>
  <div class="app-root">
    <NuxtRouteAnnouncer />
    <ConnectionStatus />
    <main class="app-main">
      <NuxtPage />
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
}
</style>
