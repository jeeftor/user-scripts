# Makefile for semantic versioning of JavaScript userscripts
# Works with macOS sed and awk

# Find all .js files in current directory
JS_FILES := $(wildcard *.js)

.PHONY: patch minor major list-versions

# Default target shows help
help:
	@echo "Semantic Versioning Makefile"
	@echo "Usage:"
	@echo "  make patch  - Increment patch version (x.y.Z)"
	@echo "  make minor  - Increment minor version (x.Y.0)"
	@echo "  make major  - Increment major version (X.0.0)"
	@echo "  make list   - Show current versions"
	@echo ""
	@echo "JavaScript files found: $(JS_FILES)"

# Show current versions
list:
	@echo "Current versions:"
	@for file in $(JS_FILES); do \
		version=$$(grep "// @version" "$$file" | sed 's/.*@version[[:space:]]*//'); \
		echo "  $$file: $$version"; \
	done

# Increment patch version (x.y.z -> x.y.z+1)
patch:
	@for file in $(JS_FILES); do \
		echo "Updating $$file (patch)..."; \
		sed -i '' 's|// @version \([0-9]*\)\.\([0-9]*\)\.\([0-9]*\)|// @version \1.\2.$$((\3+1))|' "$$file"; \
		sed -i '' 's|// @version \([0-9]*\)\.\([0-9]*\)\.\$$((.*+1))|// @version \1.\2.'$$(awk '/\/\/ @version/ {split($$3, v, "."); print v[3]+1}' "$$file" | head -1)'|' "$$file"; \
	done
	@$(MAKE) list

# More reliable patch increment using awk
patch:
	@for file in $(JS_FILES); do \
		echo "Updating $$file (patch)..."; \
		awk '/\/\/ @version/ {split($$3, v, "."); $$3 = v[1] "." v[2] "." (v[3]+1)} 1' "$$file" > "$$file.tmp" && mv "$$file.tmp" "$$file"; \
	done
	@$(MAKE) list

# Increment minor version (x.y.z -> x.y+1.0)
minor:
	@for file in $(JS_FILES); do \
		echo "Updating $$file (minor)..."; \
		awk '/\/\/ @version/ {split($$3, v, "."); $$3 = v[1] "." (v[2]+1) ".0"} 1' "$$file" > "$$file.tmp" && mv "$$file.tmp" "$$file"; \
	done
	@$(MAKE) list

# Increment major version (x.y.z -> x+1.0.0)
major:
	@for file in $(JS_FILES); do \
		echo "Updating $$file (major)..."; \
		awk '/\/\/ @version/ {split($$3, v, "."); $$3 = (v[1]+1) ".0.0"} 1' "$$file" > "$$file.tmp" && mv "$$file.tmp" "$$file"; \
	done
	@$(MAKE) list