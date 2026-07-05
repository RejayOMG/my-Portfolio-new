<script setup lang="ts">
const content = useContentStore()

// content is fetched once at build/prerender time and inlined in the payload
await useAsyncData('content', async () => {
  await content.load()
  return true
})

useHead({
  title: content.settings.title,
})
</script>

<template>
  <div class="site">
    <ClientOnly>
      <WebglCanvas />
      <NoiseOverlay />
    </ClientOnly>

    <NuxtPage />

    <SiteLogo />
    <SiteMenu />
    <ShowreelBar />
    <SoundToggle />
    <VideoModal />
    <CustomCursor />

    <ClientOnly>
      <IntroOverlay />
    </ClientOnly>
  </div>
</template>
