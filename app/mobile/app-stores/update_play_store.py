"""Update Google Play Store app listing strings from locale JSON files."""

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Google Play API scopes
SCOPES = ["https://www.googleapis.com/auth/androidpublisher"]

# Mapping of locale names to Google Play language codes
# See https://support.google.com/googleplay/android-developer/answer/9844778
LOCALE_TO_PLAY_LANG = {
    "en": "en-US",
    "es": "es-ES",
    "fr": "fr-FR",
    "de": "de-DE",
    "it": "it-IT",
    "pt": "pt-BR",
    "ja": "ja-JP",
    "zh-Hans": "zh-CN",
    "zh-Hant": "zh-TW",
    "ru": "ru-RU",
    "ko": "ko-KR",
    # Add more mappings as needed
}


@dataclass(kw_only=True, slots=True)
class StoreUpdate:
    """App listing updates for multiple languages.

    Attributes:
        package_name: Android app package name
        listings: Dict mapping Google Play language codes (e.g., 'en-US', 'es-ES')
                 to ListingUpdate objects with translated content
    """

    package_name: str
    listings: dict[str, ListingUpdate]


@dataclass(kw_only=True, slots=True)
class ListingUpdate:
    """A single app listing update in a specific language."""

    title: str | None
    short_description: str | None
    full_description: str | None


@dataclass(kw_only=True, slots=True)
class CommandLineArgs:
    """Parsed and validated command-line arguments."""

    package_name: str
    locales: list[str]
    credentials: str | None = None
    service_account: str | None = None
    dry_run: bool = False

    @classmethod
    def parse(cls, argv: list[str]) -> "CommandLineArgs":
        """Parse and validate command-line arguments.

        Args:
            argv: Argument list (e.g., sys.argv[1:])

        Returns:
            CommandLineArgs instance with validated arguments

        Raises:
            SystemExit: If arguments are invalid
        """
        parser = argparse.ArgumentParser(
            description="Update Google Play Store app listing strings from locale JSON files"
        )
        parser.add_argument(
            "--package-name", help="Android app package name", default="org.couchers.android"
        )
        parser.add_argument(
            "--credentials",
            help="Path to OAuth2 credentials JSON file",
        )
        parser.add_argument(
            "--service-account",
            help="Path to service account JSON file",
        )
        parser.add_argument(
            "--locales",
            nargs="+",
            required=True,
            help="List of locale codes to update (e.g., en es fr)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Abandon edit without committing to Play Store",
        )

        args = parser.parse_args(argv)

        # Validate that at least one auth method is provided
        if not args.credentials and not args.service_account:
            parser.error("Either --credentials or --service-account must be provided")

        return cls(
            package_name=args.package_name,
            locales=args.locales,
            credentials=args.credentials,
            service_account=args.service_account,
            dry_run=args.dry_run,
        )


def main(args: CommandLineArgs) -> None:
    """Main entry point."""

    # Determine the script directory to find locale files
    locales_dir = Path(__file__).parent / "locales"

    # Build data model
    listings = {}
    for locale in args.locales:
        locale_file = locales_dir / f"{locale}.json"
        play_language = LOCALE_TO_PLAY_LANG.get(locale, locale)
        listings[play_language] = load_listing(locale_file, play_language)

    store_update = StoreUpdate(package_name=args.package_name, listings=listings)

    credentials = build_credentials(
        credentials_path=args.credentials, service_account_json=args.service_account
    )

    update_play_store_listing(credentials, store_update, dry_run=args.dry_run)


def load_listing(strings_path: Path) -> ListingUpdate:
    """Load a locale JSON file and create a ListingUpdate.

    Args:
        locale_path: Path to locale JSON file

    Returns:
        ListingUpdate object with parsed data
    """
    with open(strings_path, encoding="utf-8") as f:
        data = json.load(f)

    return ListingUpdate(
        title=data.get("title"),
        short_description=data.get("short-description"),
        full_description=data.get("full-description"),
    )


def build_credentials(
    credentials_path: str | None = None, service_account_json: str | None = None
):
    """Build credentials for Google Play API.

    Args:
        credentials_path: Path to OAuth2 credentials JSON file
        service_account_json: Path to service account JSON file

    Returns:
        Credentials object
    """
    if service_account_json:
        return service_account.Credentials.from_service_account_file(
            service_account_json, scopes=SCOPES
        )
    elif credentials_path:
        flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
        return flow.run_local_server(port=0)
    else:
        raise ValueError(
            "Either credentials_path or service_account_json must be provided"
        )


def update_play_store_listing(
    credentials: Any, store_update: StoreUpdate, dry_run: bool = False
) -> None:
    """Update app listing on Google Play Store.

    Creates an edit session, updates all listings, and commits or abandons the edit.

    Args:
        credentials: Google credentials object
        store_update: StoreUpdate with all updates to apply
        dry_run: If True, abandon the edit without committing
    """
    service = build("androidpublisher", "v3", credentials=credentials)

    edit_id = (
        service.edits().insert(body={}, packageName=store_update.package_name).execute()
    )["id"]
    print(f"Created edit session: {edit_id}")

    # Update each language's listing
    for language_code, listing_update in store_update.listings.items():
        body = {
            "language": language_code,
        }

        if listing_update.title:
            body["title"] = listing_update.title
        if listing_update.short_description:
            body["shortDescription"] = listing_update.short_description
        if listing_update.full_description:
            body["fullDescription"] = listing_update.full_description

        service.edits().update(
            packageName=store_update.package_name,
            editId=edit_id,
            language=language_code,
            body=body,
        ).execute()

        print(f"Updated listing for {language_code}")

    # Commit or abandon edit
    if dry_run:
        print("\n[DRY RUN] Abandoning edit without committing to Play Store")
        service.edits().delete(
            packageName=store_update.package_name, editId=edit_id
        ).execute()
    else:
        print("\nCommitting edit to Play Store...")
        service.edits().commit(
            packageName=store_update.package_name, editId=edit_id
        ).execute()
        print("Successfully committed to Play Store")


if __name__ == "__main__":
    args = CommandLineArgs.parse(sys.argv[1:])
    main(args)
