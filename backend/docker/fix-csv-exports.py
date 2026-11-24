from pathlib import Path


def replace_exact(text, old, new, expected=1):
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f"Expected {expected} occurrence(s), found {count}: {old[:80]!r}")
    return text.replace(old, new)


delivery_path = Path("src/apis/dlog/export.py")
delivery = delivery_path.read_text(encoding="utf-8")
delivery = replace_exact(delivery, "import asyncio\n", "import asyncio\nimport csv\n")
delivery = replace_exact(delivery, "from io import BytesIO", "from io import StringIO")
delivery = replace_exact(
    delivery,
    "from functions import *\n\n",
    "from functions import *\n\n\n"
    "def single_line_csv_row(values):\n"
    "    return [\" \".join(value.splitlines()) if isinstance(value, str) else value for value in values]\n\n",
)
delivery = replace_exact(
    delivery,
    "    f = BytesIO()\n",
    '    f = StringIO(newline="")\n'
    '    csv_writer = csv.writer(f, quoting=csv.QUOTE_ALL, lineterminator="\\n")\n',
)
delivery = replace_exact(
    delivery,
    "        f.write(b\"logid,",
    "        f.write(\"logid,",
    expected=2,
)
delivery = replace_exact(
    delivery,
    "            for i in range(len(data)):\n"
    "                if data[i] is None:\n"
    "                    data[i] = '\"\"'\n"
    "                else:\n"
    "                    data[i] = '\"' + str(data[i]) + '\"'\n\n"
    "            f.write(\",\".join(data).encode(\"utf-8\"))\n"
    "            f.write(b\"\\n\")\n",
    "            csv_writer.writerow(single_line_csv_row(data))\n",
)
delivery = replace_exact(delivery, "f.getvalue()", 'f.getvalue().encode("utf-8")', expected=2)
delivery_path.write_text(delivery, encoding="utf-8")


economy_path = Path("src/plugins/economy/balance.py")
economy = economy_path.read_text(encoding="utf-8")
economy = replace_exact(economy, "import math\n", "import csv\nimport math\n")
economy = replace_exact(economy, "from io import BytesIO", "from io import StringIO")
economy = replace_exact(
    economy,
    "from functions import *\n\n",
    "from functions import *\n\n\n"
    "def single_line_csv_row(values):\n"
    "    return [\" \".join(value.splitlines()) if isinstance(value, str) else value for value in values]\n\n",
)
economy = replace_exact(
    economy,
    "    f = BytesIO()\n"
    "    f.write(b\"txid, from_userid, to_userid, executor_userid, amount, message, from_new_balance, to_new_balance, time\\n\")\n",
    '    f = StringIO(newline="")\n'
    '    csv_writer = csv.writer(f, quoting=csv.QUOTE_ALL, lineterminator="\\n")\n'
    '    f.write("txid, from_userid, to_userid, executor_userid, amount, message, from_new_balance, to_new_balance, time\\n")\n',
)
economy = replace_exact(
    economy,
    "        for i in range(len(data)):\n"
    "            if data[i] is None:\n"
    "                data[i] = '\"\"'\n"
    "            else:\n"
    "                data[i] = '\"' + str(data[i]) + '\"'\n\n"
    "        f.write(\",\".join(data).encode(\"utf-8\"))\n"
    "        f.write(b\"\\n\")\n",
    "        csv_writer.writerow(single_line_csv_row(data))\n",
)
economy = replace_exact(economy, "f.getvalue()", 'f.getvalue().encode("utf-8")')
economy_path.write_text(economy, encoding="utf-8")
