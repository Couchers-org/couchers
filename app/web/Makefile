# Makefile for the frontend of the application
# Run 'make [command]' in app/web to execute the specified command
.SILENT:

.PHONY: default
default: translation-stats

.PHONY: FORCE
FORCE: # Target that forces always rebuilding

# Generate translation progress stats.
TRANSLATION_STATS_FILE := i18n/translationStats.gen.json

.PHONY: translation-stats
translation-stats: ${TRANSLATION_STATS_FILE}

${TRANSLATION_STATS_FILE}: FORCE
	node scripts/generate-translation-stats.js "${TRANSLATION_STATS_FILE}"
