<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import * as v from "valibot";
import {
  githubDonationResultSchema,
  githubDonationSummarySchema,
  type GithubDonationResult,
  type GithubDonationSummary,
} from "../../lib/githubDonations";

const { t } = useI18n({ useScope: "global" });
const donationSummary = ref<GithubDonationSummary>();
const donationSummaryState = ref<"loading" | "ready" | "error">("loading");
const donationResult = ref<GithubDonationResult>();
const isSubmitting = ref(false);

async function loadDonationSummary(): Promise<void> {
  donationSummaryState.value = "loading";
  try {
    const response = await fetch("/api/github/donations", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Donation summary request failed: HTTP ${response.status}`);
    }
    donationSummary.value = v.parse(githubDonationSummarySchema, await response.json());
    donationSummaryState.value = "ready";
  } catch (error) {
    console.error("Failed to load GitHub donation summary", error);
    donationSummaryState.value = "error";
  }
}

function beginDonation(): void {
  isSubmitting.value = true;
}

onMounted(async () => {
  const url = new URL(window.location.href);
  const parsedResult = v.safeParse(githubDonationResultSchema, url.searchParams.get("donation"));
  if (parsedResult.success) {
    donationResult.value = parsedResult.output;
    url.searchParams.delete("donation");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }
  await loadDonationSummary();
});
</script>

<template>
  <main class="about-page">
    <section class="about-section about-project" aria-labelledby="about-project-title">
      <h2 id="about-project-title">{{ t("about.project.title") }}</h2>
      <p>{{ t("about.project.description") }}</p>
    </section>

    <section class="about-section donors-section" aria-labelledby="donors-title">
      <div>
        <h2 id="donors-title">{{ t("about.donors.title") }}</h2>
        <p>{{ t("about.donors.description") }}</p>
      </div>
      <form
        action="/api/github/oauth/start"
        method="post"
        class="donation-form"
        @submit="beginDonation"
      >
        <label class="donor-visibility">
          <input type="checkbox" name="publishLogin" value="on" />
          <span>
            <strong>{{ t("about.donation.publish.label") }}</strong>
            <small>{{ t("about.donation.publish.help") }}</small>
          </span>
        </label>
        <button
          type="submit"
          class="ui-button ui-button-primary ui-focus-ring"
          :disabled="isSubmitting"
        >
          <span
            aria-hidden="true"
            :class="isSubmitting ? 'i-lucide-loader-circle donation-spinner' : 'i-lucide-github'"
          />
          {{ isSubmitting ? t("about.donation.actionRedirecting") : t("about.donation.action") }}
        </button>
        <p>{{ t("about.donation.consent") }}</p>
        <p>{{ t("about.donation.revokeInfo") }}</p>
        <a
          href="https://github.com/settings/apps/authorizations"
          target="_blank"
          rel="noopener noreferrer"
          class="donation-revoke-link ui-focus-ring"
        >
          <span aria-hidden="true" class="i-lucide-unplug" />
          {{ t("about.donation.before.revokeLink") }}
          <span aria-hidden="true" class="i-lucide-arrow-up-right" />
        </a>
      </form>

      <div v-if="donationSummaryState === 'loading'" class="donors-state" role="status">
        <span aria-hidden="true" class="i-lucide-loader-circle donation-spinner" />
        {{ t("about.donors.loading") }}
      </div>
      <div v-else-if="donationSummaryState === 'error'" class="donors-state is-error" role="alert">
        <span aria-hidden="true" class="i-lucide-wifi-off" />
        <div>
          <p>{{ t("about.donors.error") }}</p>
          <button
            type="button"
            class="ui-button ui-button-secondary ui-focus-ring"
            @click="loadDonationSummary"
          >
            {{ t("about.donors.retry") }}
          </button>
        </div>
      </div>
      <div v-else-if="donationSummary" class="donors-content">
        <p class="donation-count">
          {{ t("about.donors.count", { count: donationSummary.totalDonations }) }}
        </p>
        <ul v-if="donationSummary.publicDonors.length > 0" class="donor-list">
          <li v-for="donor in donationSummary.publicDonors" :key="donor.login">
            <a
              :href="donor.profileUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="ui-focus-ring"
            >
              <span aria-hidden="true" class="i-lucide-github" />
              {{ donor.login }}
            </a>
          </li>
        </ul>
        <p v-else class="donors-empty">
          {{
            donationSummary.totalDonations > 0
              ? t("about.donors.anonymousOnly")
              : t("about.donors.empty")
          }}
        </p>
      </div>
    </section>
  </main>
</template>

<style>
.about-page {
  width: min(100%, 62rem);
  margin-inline: auto;
  display: grid;
}

.about-section {
  padding-block: clamp(2.5rem, 7vw, 5rem);
  display: grid;
  gap: var(--ui-space-6);
  border-bottom: 1px solid var(--ui-border);
}

.about-section:last-child {
  border-bottom: 0;
}

.about-section h2 {
  color: var(--ui-text-strong);
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.25;
}

.about-project > p {
  color: var(--ui-text-muted);
  line-height: 1.8;
}

.donors-section > div:first-child {
  display: grid;
  align-content: start;
  gap: var(--ui-space-3);
}

.donation-form {
  padding: clamp(1.25rem, 4vw, 2rem);
  display: grid;
  gap: var(--ui-space-4);
  background: var(--ui-surface-muted);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-2xl);
}

.donor-visibility {
  min-height: 3.5rem;
  display: grid;
  align-items: start;
  gap: var(--ui-space-3);
  cursor: pointer;
}

.donor-visibility input {
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.15rem;
  accent-color: var(--ui-primary);
}

.donor-visibility input:focus-visible {
  outline: 2px solid var(--ui-focus);
  outline-offset: 3px;
}

.donor-visibility > span {
  display: grid;
  gap: var(--ui-space-1);
}

.donor-visibility strong {
  font-size: var(--ui-text-sm);
}

.donor-visibility small,
.donation-form > p {
  color: var(--ui-text-subtle);
  font-size: var(--ui-text-xs);
  line-height: 1.6;
}

.donation-revoke-link {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: var(--ui-space-2);
  color: var(--ui-primary-text);
  font-size: var(--ui-text-xs);
  font-weight: 500;
}

.donation-revoke-link:hover {
  text-decoration: underline;
}

.donation-revoke-link > span {
  width: 1rem;
  height: 1rem;
  flex: none;
}

.donation-form .ui-button {
  min-height: 3rem;
  justify-self: start;
}

.donation-form .ui-button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.donation-spinner {
  animation: donation-spin 800ms linear infinite;
}

@keyframes donation-spin {
  to {
    transform: rotate(1turn);
  }
}

.donors-state {
  min-height: 8rem;
  padding: var(--ui-space-6);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ui-space-4);
  background: var(--ui-surface-muted);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-xl);
  color: var(--ui-text-muted);
}

.donors-state.is-error {
  background: light-dark(oklch(96% 0.035 25), oklch(24% 0.045 25));
  border-color: light-dark(oklch(84% 0.07 25), oklch(43% 0.075 25));
  color: light-dark(oklch(42% 0.13 25), oklch(86% 0.075 25));
}

.donors-state > span {
  width: 1.25rem;
  height: 1.25rem;
  flex: none;
}

.donors-state > div {
  display: grid;
  justify-items: start;
  gap: var(--ui-space-4);
}

.donors-content {
  display: grid;
  gap: var(--ui-space-6);
}

.donation-count {
  color: var(--ui-text-strong);
  font-size: var(--ui-text-lg);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

.donor-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ui-space-2);
}

.donor-list a {
  min-height: 2.75rem;
  padding: var(--ui-space-2) var(--ui-space-3);
  display: inline-flex;
  align-items: center;
  gap: var(--ui-space-2);
  background: var(--ui-surface);
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  color: var(--ui-text-muted);
  font-size: var(--ui-text-sm);
  transition:
    background-color 150ms ease-out,
    border-color 150ms ease-out,
    color 150ms ease-out;
}

.donor-list a:hover {
  background: var(--ui-primary-soft);
  border-color: var(--ui-primary-border);
  color: var(--ui-primary-text);
}

.donor-list span {
  width: 1rem;
  height: 1rem;
}

.donors-empty {
  max-width: 65ch;
  color: var(--ui-text-subtle);
  line-height: 1.7;
}

@media (min-width: 48rem) {
  .donors-section {
    column-gap: var(--ui-space-12);
  }
}

@media (prefers-reduced-motion: reduce) {
  .donation-spinner {
    animation-duration: 1.8s;
  }
}
</style>
