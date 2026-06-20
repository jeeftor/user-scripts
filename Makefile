USER_SCRIPTS := $(shell find . -maxdepth 1 -name '*.js'; find scripts -name '*.user.js' 2>/dev/null)

.PHONY: help list patch minor major test

help:
	@printf '%s\n' 'Available targets:'
	@printf '  %-10s %s\n' 'help' 'Show this help.'
	@printf '  %-10s %s\n' 'list' 'Show userscript versions.'
	@printf '  %-10s %s\n' 'patch' 'Increment patch versions.'
	@printf '  %-10s %s\n' 'minor' 'Increment minor versions.'
	@printf '  %-10s %s\n' 'major' 'Increment major versions.'
	@printf '  %-10s %s\n' 'test' 'Run userscript checks.'

list:
	@printf '%s\n' 'Current versions:'
	@for file in $(USER_SCRIPTS); do \
		version=$$(awk '/\/\/ @version/ {print $$3; exit}' "$$file"); \
		printf '  %s: %s\n' "$$file" "$${version:-none}"; \
	done

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
