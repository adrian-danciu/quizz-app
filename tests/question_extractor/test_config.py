import unittest

from tools.question_extractor.config import EXPECTED_TOTAL, MODULES


class ModuleConfigTests(unittest.TestCase):
    def test_inventory_has_approved_module_count_and_total(self) -> None:
        self.assertEqual(len(MODULES), 15)
        self.assertEqual(EXPECTED_TOTAL, 714)
        self.assertEqual(sum(module.question_count for module in MODULES), 714)

    def test_networking_is_one_combined_module(self) -> None:
        networking = [
            module
            for module in MODULES
            if "retele-de-calculatoare" in module.id
        ]
        self.assertEqual(len(networking), 1)
        self.assertEqual(networking[0].question_count, 58)

    def test_module_ids_and_orders_are_unique(self) -> None:
        self.assertEqual(len({module.id for module in MODULES}), 15)
        self.assertEqual(
            [module.order for module in MODULES],
            list(range(1, 16)),
        )


if __name__ == "__main__":
    unittest.main()
