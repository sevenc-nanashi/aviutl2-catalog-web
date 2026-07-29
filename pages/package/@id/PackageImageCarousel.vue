<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  images: string[];
  packageName: string;
}>();
const { t } = useI18n({ useScope: "global" });

const carouselElement = ref<HTMLElement>();
const activeIndex = ref(0);

function requireCarouselElement(): HTMLElement {
  const element = carouselElement.value;
  if (element === undefined) {
    throw new Error("Package image carousel element is undefined");
  }
  return element;
}

function scrollTo(index: number): void {
  const element = requireCarouselElement();
  const slide = element.children.item(index);
  if (!(slide instanceof HTMLElement)) {
    throw new Error(`Package image carousel slide ${index} is undefined`);
  }
  element.scrollTo({
    left: slide.offsetLeft,
    behavior: "smooth",
  });
}

function updateActiveIndex(): void {
  const element = requireCarouselElement();
  const slideOffsets = [...element.children].map((slide) => {
    if (!(slide instanceof HTMLElement)) {
      throw new Error("Package image carousel slide is not an HTML element");
    }
    return Math.abs(slide.offsetLeft - element.scrollLeft);
  });
  const closestOffset = Math.min(...slideOffsets);
  activeIndex.value = slideOffsets.indexOf(closestOffset);
}

function showPrevious(): void {
  scrollTo(Math.max(activeIndex.value - 1, 0));
}

function showNext(): void {
  scrollTo(Math.min(activeIndex.value + 1, props.images.length - 1));
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showPrevious();
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    showNext();
  }
}
</script>

<template>
  <div
    class="image-carousel ui-focus-ring"
    role="region"
    aria-roledescription="carousel"
    :aria-label="t('package.carousel.region')"
    tabindex="0"
    @keydown="handleKeydown"
  >
    <div ref="carouselElement" class="screenshot-grid" @scroll.passive="updateActiveIndex">
      <img
        v-for="(image, index) in images"
        :key="image"
        class="screenshot-frame"
        :src="image"
        :alt="t('package.carousel.image', { name: packageName, index: index + 1 })"
        loading="lazy"
        decoding="async"
      />
    </div>

    <button
      v-if="activeIndex > 0"
      class="carousel-button carousel-button-previous ui-focus-ring"
      type="button"
      :aria-label="t('package.carousel.previous')"
      @click="showPrevious"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>
    <button
      v-if="activeIndex < images.length - 1"
      class="carousel-button carousel-button-next ui-focus-ring"
      type="button"
      :aria-label="t('package.carousel.next')"
      @click="showNext"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>

    <div v-if="images.length > 1" class="carousel-indicators" role="tablist">
      <button
        v-for="(_, index) in images"
        :key="index"
        class="carousel-indicator ui-focus-ring"
        :class="{ active: index === activeIndex }"
        type="button"
        role="tab"
        :aria-selected="index === activeIndex"
        :aria-label="
          t('package.carousel.slide', {
            current: index + 1,
            total: images.length,
          })
        "
        @click="scrollTo(index)"
      />
    </div>
  </div>
</template>
