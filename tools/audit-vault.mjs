#!/usr/bin/env node
import { runCompatibilityCheck } from './lib/compat-check-wrapper.mjs';

runCompatibilityCheck('tools/audit-vault.mjs');
