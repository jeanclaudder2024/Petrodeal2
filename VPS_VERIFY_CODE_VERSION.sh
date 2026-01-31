#!/bin/bash

echo "=========================================="
echo "  Verify VPS Code Version"
echo "=========================================="

cd /opt/petrodealhub/document-processor

echo "1. Current commit:"
git log --oneline -1

echo ""
echo "2. Check if validation function exists:"
if grep -q "def _is_value_wrong_for_placeholder" main.py; then
    echo "✅ _is_value_wrong_for_placeholder function EXISTS"
    echo "   Line number:"
    grep -n "def _is_value_wrong_for_placeholder" main.py | head -1
else
    echo "❌ _is_value_wrong_for_placeholder function MISSING"
fi

echo ""
echo "3. Check if validation is used during generation:"
if grep -q "_is_value_wrong_for_placeholder(placeholder, matched_value)" main.py; then
    echo "✅ Validation IS being used during generation"
    echo "   Context:"
    grep -B 2 -A 2 "_is_value_wrong_for_placeholder(placeholder, matched_value)" main.py | head -10
else
    echo "❌ Validation NOT being used during generation"
fi

echo ""
echo "4. Check if intelligent multi-table matching exists:"
if grep -q "def _intelligent_field_match_multi_table" main.py; then
    echo "✅ _intelligent_field_match_multi_table function EXISTS"
else
    echo "❌ _intelligent_field_match_multi_table function MISSING"
fi

echo ""
echo "5. File hash (to verify it's the right version):"
md5sum main.py | cut -d' ' -f1

echo ""
echo "=========================================="
echo "  Diagnosis:"
echo "=========================================="
echo "If functions are MISSING, the file wasn't updated correctly."
echo "Run: cd /opt/petrodealhub && bash VPS_FORCE_UPDATE_NOW.sh"
echo "=========================================="
