# Vendored from https://github.com/jerry-git/pytest-split

# Copyright (c) 2024 Jerry Pussinen
#
# Permission is hereby granted, free of charge, to any person obtaining
# a copy of this software and associated documentation files (the
# "Software"), to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so, subject to
# the following conditions:
#
# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
# IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
# CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
# TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
from __future__ import annotations

import enum
import heapq
from abc import ABC, abstractmethod
from operator import itemgetter
from typing import TYPE_CHECKING, NamedTuple

if TYPE_CHECKING:
    from _pytest import nodes


class TestGroup(NamedTuple):
    selected: list[nodes.Item]
    deselected: list[nodes.Item]
    duration: float


class AlgorithmBase(ABC):
    """Abstract base class for the algorithm implementations."""

    @abstractmethod
    def __call__(self, splits: int, items: list[nodes.Item], durations: dict[str, float]) -> list[TestGroup]:
        pass

    def __hash__(self) -> int:
        return hash(self.__class__.__name__)

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, AlgorithmBase):
            return NotImplemented
        return self.__class__.__name__ == other.__class__.__name__


class LeastDurationAlgorithm(AlgorithmBase):
    """
    Split tests into groups by runtime.
    It walks the test items, starting with the test with largest duration.
    It assigns the test with the largest runtime to the group with the smallest duration sum.

    The algorithm sorts the items by their duration. Since the sorting algorithm is stable, ties will be broken by
    maintaining the original order of items. It is therefore important that the order of items be identical on all nodes
    that use this plugin. Due to issue #25 this might not always be the case.

    :param splits: How many groups we're splitting in.
    :param items: Test items passed down by Pytest.
    :param durations: Our cached test runtimes. Assumes contains timings only of relevant tests
    :return:
        List of groups
    """

    def __call__(self, splits: int, items: list[nodes.Item], durations: dict[str, float]) -> list[TestGroup]:
        items_with_durations = _get_items_with_durations(items, durations)

        # add index of item in list
        items_with_durations_indexed = [(*tup, i) for i, tup in enumerate(items_with_durations)]

        # Sort by name to ensure it's always the same order
        items_with_durations_indexed = sorted(items_with_durations_indexed, key=lambda tup: str(tup[0]))

        # sort in ascending order
        sorted_items_with_durations = sorted(items_with_durations_indexed, key=lambda tup: tup[1], reverse=True)

        selected: list[list[tuple[nodes.Item, int]]] = [[] for _ in range(splits)]
        deselected: list[list[nodes.Item]] = [[] for _ in range(splits)]
        duration: list[float] = [0 for _ in range(splits)]

        # create a heap of the form (summed_durations, group_index)
        heap: list[tuple[float, int]] = [(0, i) for i in range(splits)]
        heapq.heapify(heap)
        for item, item_duration, original_index in sorted_items_with_durations:
            # get group with smallest sum
            summed_durations, group_idx = heapq.heappop(heap)
            new_group_durations = summed_durations + item_duration

            # store assignment
            selected[group_idx].append((item, original_index))
            duration[group_idx] = new_group_durations
            for i in range(splits):
                if i != group_idx:
                    deselected[i].append(item)

            # store new duration - in case of ties it sorts by the group_idx
            heapq.heappush(heap, (new_group_durations, group_idx))

        groups = []
        for i in range(splits):
            # sort the items by their original index to maintain relative ordering
            # we don't care about the order of deselected items
            s = [item for item, original_index in sorted(selected[i], key=lambda tup: tup[1])]
            group = TestGroup(selected=s, deselected=deselected[i], duration=duration[i])
            groups.append(group)
        return groups


class DurationBasedChunksAlgorithm(AlgorithmBase):
    """
    Split tests into groups by runtime.
    Ensures tests are split into non-overlapping groups.
    The original list of test items is split into groups by finding boundary indices i_0, i_1, i_2
    and creating group_1 = items[0:i_0], group_2 = items[i_0, i_1], group_3 = items[i_1, i_2], ...

    :param splits: How many groups we're splitting in.
    :param items: Test items passed down by Pytest.
    :param durations: Our cached test runtimes. Assumes contains timings only of relevant tests
    :return: List of TestGroup
    """

    def __call__(self, splits: int, items: list[nodes.Item], durations: dict[str, float]) -> list[TestGroup]:
        items_with_durations = _get_items_with_durations(items, durations)
        time_per_group = sum(map(itemgetter(1), items_with_durations)) / splits

        selected: list[list[nodes.Item]] = [[] for i in range(splits)]
        deselected: list[list[nodes.Item]] = [[] for i in range(splits)]
        duration: list[float] = [0 for i in range(splits)]

        group_idx = 0
        for item, item_duration in items_with_durations:
            if duration[group_idx] >= time_per_group:
                group_idx += 1

            selected[group_idx].append(item)
            for i in range(splits):
                if i != group_idx:
                    deselected[i].append(item)
            duration[group_idx] += item_duration

        return [TestGroup(selected=selected[i], deselected=deselected[i], duration=duration[i]) for i in range(splits)]


def _get_items_with_durations(items: list[nodes.Item], durations: dict[str, float]) -> list[tuple[nodes.Item, float]]:
    durations = _remove_irrelevant_durations(items, durations)
    avg_duration_per_test = _get_avg_duration_per_test(durations)
    items_with_durations = [(item, durations.get(item.nodeid, avg_duration_per_test)) for item in items]
    return items_with_durations


def _get_avg_duration_per_test(durations: dict[str, float]) -> float:
    if durations:
        avg_duration_per_test = sum(durations.values()) / len(durations)
    else:
        # If there are no durations, give every test the same arbitrary value
        avg_duration_per_test = 1
    return avg_duration_per_test


def _remove_irrelevant_durations(items: list[nodes.Item], durations: dict[str, float]) -> dict[str, float]:
    # Filtering down durations to relevant ones ensures the avg isn't skewed by irrelevant data
    test_ids = [item.nodeid for item in items]
    durations = {name: durations[name] for name in test_ids if name in durations}
    return durations


class Algorithms(enum.Enum):
    duration_based_chunks = DurationBasedChunksAlgorithm()
    least_duration = LeastDurationAlgorithm()

    @staticmethod
    def names() -> list[str]:
        return [x.name for x in Algorithms]
