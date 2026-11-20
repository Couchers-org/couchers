# Root makefile, building every component.
.SILENT:
MAKEFLAGS += --no-print-directory

SUBDIRS := backend client media proxy web mobile

.PHONY: default
default: $(SUBDIRS)

.PHONY: proto
proto:
	$(MAKE) -C proto

.PHONY: $(SUBDIRS)
$(SUBDIRS): proto
	$(MAKE) -C $@

# make protos: Generates protos and runs each component's protos copying target.
.PHONY: protos
protos: $(addprefix protos-,$(SUBDIRS))

.PHONY: $(addprefix protos-,$(SUBDIRS))
$(addprefix protos-,$(SUBDIRS)): protos-%: proto
	$(MAKE) -C $* protos
