USER_SCRIPTS := $(shell find . -maxdepth 1 -name '*.js'; find scripts -name '*.user.js' 2>/dev/null)

.PHONY: help list changed-versions all-versions patch minor major test check install-hooks

install-hooks:
	git config core.hooksPath .githooks

help:
	@printf '%s\n' 'Available targets:'
	@printf '  %-10s %s\n' 'help' 'Show this help.'
	@printf '  %-10s %s\n' 'list' 'Show userscript versions.'
	@printf '  %-16s %s\n' 'changed-versions' 'Increment patch versions for changed userscripts.'
	@printf '  %-16s %s\n' 'all-versions' 'Increment patch versions for all userscripts.'
	@printf '  %-10s %s\n' 'patch' 'Increment patch versions.'
	@printf '  %-10s %s\n' 'minor' 'Increment minor versions.'
	@printf '  %-10s %s\n' 'major' 'Increment major versions.'
	@printf '  %-10s %s\n' 'test' 'Run userscript checks.'
	@printf '  %-10s %s\n' 'check' 'Run tests and JavaScript syntax checks.'

list:
	@printf '%s\n' 'Current versions:'
	@for file in $(USER_SCRIPTS); do \
		version=$$(awk '/\/\/ @version/ {print $$3; exit}' "$$file"); \
		printf '  %s: %s\n' "$$file" "$${version:-none}"; \
	done

changed-versions:
	node scripts/bump-userscript-versions.mjs --changed

all-versions:
	node scripts/bump-userscript-versions.mjs --all

patch:
	@for file in $(USER_SCRIPTS); do \
		awk '/\/\/ @version/ {split($$3, v, "."); $$3 = v[1] "." v[2] "." (v[3] + 1)} 1' "$$file" > "$$file.tmp" && mv "$$file.tmp" "$$file"; \
	done
	@$(MAKE) list

minor:
	@for file in $(USER_SCRIPTS); do \
		awk '/\/\/ @version/ {split($$3, v, "."); $$3 = v[1] "." (v[2] + 1) ".0"} 1' "$$file" > "$$file.tmp" && mv "$$file.tmp" "$$file"; \
	done
	@$(MAKE) list

major:
	@for file in $(USER_SCRIPTS); do \
		awk '/\/\/ @version/ {split($$3, v, "."); $$3 = (v[1] + 1) ".0.0"} 1' "$$file" > "$$file.tmp" && mv "$$file.tmp" "$$file"; \
	done
	@$(MAKE) list

test:
	npm test

check:
	npm test
	node --check scripts/bump-userscript-versions.mjs
	node --check scripts/check-userscript-version-bumps.mjs
	@for file in $(USER_SCRIPTS); do \
		node --check "$$file"; \
	done
