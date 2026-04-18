"""
Django management command to seed the database with São Paulo locations data.
Creates producers, locations, products, and categories for testing.
"""
import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.users.models import User
from apps.producers.models import ProducerProfile
from apps.locations.models import Location
from apps.products.models import Product, Category
from apps.common.models import Address


class Command(BaseCommand):
    help = 'Popula o banco de dados com localizações em São Paulo'

    def add_arguments(self, parser):
        parser.add_argument(
            '--producers',
            type=int,
            default=10,
            help='Número de produtores para criar (padrão: 10)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Limpa dados existentes antes de popular'
        )

    def handle(self, *args, **options):
        num_producers = options['producers']
        clear_data = options['clear']

        if clear_data:
            self.stdout.write(self.style.WARNING('Limpando dados existentes...'))
            self._clear_data()

        self.stdout.write(self.style.SUCCESS(f'Iniciando população do banco de dados...'))
        self.stdout.write(f'Criando {num_producers} produtores com localizações em São Paulo\n')

        with transaction.atomic():
            # Step 1: Create categories
            categories = self._create_categories()
            
            # Step 2: Create products
            products = self._create_products(categories)
            
            # Step 3: Create producers with locations
            self._create_producers_and_locations(num_producers, products)

        self.stdout.write(self.style.SUCCESS('\n✅ População concluída com sucesso!'))

    def _clear_data(self):
        """Remove existing test data"""
        from django.db import connection
        
        # Get all users with the test email domain
        test_users = User.objects.filter(email__contains='@feirasaopaulo.com')
        
        # Delete related data first (cascade should handle most, but being explicit)
        Location.objects.filter(producer__user__in=test_users).delete()
        ProducerProfile.objects.filter(user__in=test_users).delete()
        test_users.delete()
        
        # Reset auto-increment if using MySQL
        if 'mysql' in connection.settings_dict['ENGINE']:
            with connection.cursor() as cursor:
                # This helps avoid ID conflicts
                pass
                
        self.stdout.write(self.style.SUCCESS('✓ Dados de teste removidos'))

    def _create_categories(self):
        """Create product categories"""
        self.stdout.write('📦 Criando categorias de produtos...')
        
        categories_data = [
            {'name': 'Verduras', 'slug': 'verduras', 'icon': '🥬', 'description': 'Alface, couve, rúcula, etc'},
            {'name': 'Legumes', 'slug': 'legumes', 'icon': '🥕', 'description': 'Cenoura, beterraba, abobrinha, etc'},
            {'name': 'Frutas', 'slug': 'frutas', 'icon': '🍎', 'description': 'Maçã, banana, laranja, etc'},
            {'name': 'Hortaliças', 'slug': 'hortalicas', 'icon': '🌿', 'description': 'Tomate, pimentão, pepino, etc'},
            {'name': 'Grãos e Cereais', 'slug': 'graos-cereais', 'icon': '🌾', 'description': 'Arroz, feijão, milho, etc'},
            {'name': 'Temperos', 'slug': 'temperos', 'icon': '🌶️', 'description': 'Alho, cebola, manjericão, etc'},
            {'name': 'Ovos e Laticínios', 'slug': 'ovos-laticinios', 'icon': '🥚', 'description': 'Ovos caipiras, queijos artesanais'},
        ]
        
        categories = {}
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults=cat_data
            )
            categories[cat_data['slug']] = category
            if created:
                self.stdout.write(f'  ✓ {category.name}')
        
        return categories

    def _create_products(self, categories):
        """Create products for each category"""
        self.stdout.write('\n🥬 Criando produtos...')
        
        products_data = {
            'verduras': ['Alface Crespa', 'Alface Americana', 'Couve', 'Rúcula', 'Agrião', 'Escarola'],
            'legumes': ['Cenoura', 'Beterraba', 'Abobrinha', 'Berinjela', 'Chuchu', 'Batata Doce'],
            'frutas': ['Banana Prata', 'Laranja Lima', 'Limão Taiti', 'Maçã Gala', 'Mamão Papaya', 'Goiaba'],
            'hortalicas': ['Tomate Italiano', 'Pimentão Verde', 'Pepino Japonês', 'Jiló', 'Quiabo', 'Vagem'],
            'graos-cereais': ['Feijão Carioca', 'Arroz Integral', 'Milho Verde', 'Ervilha', 'Grão de Bico'],
            'temperos': ['Cebolinha', 'Salsa', 'Coentro', 'Manjericão', 'Alecrim', 'Hortelã'],
            'ovos-laticinios': ['Ovos Caipira', 'Queijo Minas', 'Requeijão Artesanal', 'Iogurte Natural'],
        }
        
        all_products = []
        for slug, product_names in products_data.items():
            category = categories.get(slug)
            if not category:
                continue
                
            for name in product_names:
                product, created = Product.objects.get_or_create(
                    name=name,
                    category=category,
                    defaults={'description': f'{name} orgânico(a) de qualidade superior'}
                )
                all_products.append(product)
                if created:
                    self.stdout.write(f'  ✓ {name}')
        
        return all_products

    def _create_producers_and_locations(self, num_producers, products):
        """Create producers with their locations"""
        self.stdout.write(f'\n👨‍🌾 Criando {num_producers} produtores...')
        
        created_count = 0
        locations_created = 0
        
        producer_names = [
            'Sítio Verde Vida', 'Fazenda Orgânica Paulista', 'Horta da Terra',
            'Rancho da Natureza', 'Chácara Boa Colheita', 'Fazenda São José',
            'Sítio Caminho Verde', 'Horta Sustentável', 'Fazenda Raízes',
            'Chácara Bela Vista', 'Sítio Flor do Campo', 'Horta Natural',
            'Fazenda Vale Verde', 'Rancho do Sol', 'Chácara Campo Feliz',
        ]
        
        first_names = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Juliana', 'Roberto', 'Fernanda', 'Paulo', 'Beatriz']
        last_names = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Pereira', 'Rodrigues', 'Almeida', 'Lima', 'Ferreira']
        
        # São Paulo neighborhoods with approximate coordinates
        neighborhoods = [
            {'name': 'Vila Madalena', 'lat': -23.5505, 'lng': -46.6875, 'street_prefix': 'Rua'},
            {'name': 'Pinheiros', 'lat': -23.5689, 'lng': -46.6903, 'street_prefix': 'Avenida'},
            {'name': 'Moema', 'lat': -23.5966, 'lng': -46.6612, 'street_prefix': 'Rua'},
            {'name': 'Itaim Bibi', 'lat': -23.5844, 'lng': -46.6773, 'street_prefix': 'Rua'},
            {'name': 'Vila Mariana', 'lat': -23.5880, 'lng': -46.6354, 'street_prefix': 'Rua'},
            {'name': 'Jardins', 'lat': -23.5675, 'lng': -46.6561, 'street_prefix': 'Alameda'},
            {'name': 'Perdizes', 'lat': -23.5362, 'lng': -46.6748, 'street_prefix': 'Rua'},
            {'name': 'Santana', 'lat': -23.5055, 'lng': -46.6291, 'street_prefix': 'Rua'},
            {'name': 'Tatuapé', 'lat': -23.5388, 'lng': -46.5772, 'street_prefix': 'Rua'},
            {'name': 'Brooklin', 'lat': -23.6137, 'lng': -46.6970, 'street_prefix': 'Avenida'},
            {'name': 'Ipiranga', 'lat': -23.5925, 'lng': -46.5998, 'street_prefix': 'Rua'},
            {'name': 'Lapa', 'lat': -23.5280, 'lng': -46.7016, 'street_prefix': 'Rua'},
            {'name': 'Butantã', 'lat': -23.5680, 'lng': -46.7280, 'street_prefix': 'Avenida'},
            {'name': 'Saúde', 'lat': -23.6172, 'lng': -46.6393, 'street_prefix': 'Rua'},
            {'name': 'Penha', 'lat': -23.5280, 'lng': -46.5381, 'street_prefix': 'Rua'},
        ]
        
        street_names = [
            'das Flores', 'dos Orgânicos', 'da Agricultura', 'Verde', 'da Natureza',
            'dos Produtores', 'da Colheita', 'do Campo', 'da Horta', 'Sustentável',
            'Ecológica', 'da Terra Boa', 'do Plantio', 'da Semente'
        ]
        
        location_types = ['FAIR', 'STORE', 'DELIVERY']
        operation_days_options = [
            'Sábado', 'Quarta e Sábado', 'Segunda a Sábado', 
            'Terça a Domingo', 'Domingo', 'Segunda a Sexta'
        ]
        operation_hours_options = [
            '7h às 13h', '6h às 12h', '8h às 14h', 
            '7h às 12h', '9h às 15h', '6h30 às 13h30'
        ]
        
        for i in range(num_producers):
            # Create user with timestamp to ensure uniqueness
            import time
            timestamp = int(time.time() * 1000) % 100000  # Use last 5 digits of timestamp
            
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            email = f'{first_name.lower()}.{last_name.lower()}.{i}.{timestamp}@feirasaopaulo.com'
            
            # Use get_or_create to avoid duplicates
            user, user_created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first_name,
                    'last_name': last_name,
                    'user_type': 'PRODUCER',
                    'phone': f'(11) 9{random.randint(1000, 9999)}-{random.randint(1000, 9999)}'
                }
            )
            
            # Set password if user was just created
            if user_created:
                user.set_password('senha123')
                user.save()
            
            # Check if profile already exists
            profile, profile_created = ProducerProfile.objects.get_or_create(
                user=user,
                defaults={
                    'business_name': producer_names[i] if i < len(producer_names) else f'{random.choice(producer_names)} {i+1}',
                    'description': f'Produção orgânica certificada de hortaliças, frutas e verduras frescas. '
                                   f'Cultivamos com amor e respeito à natureza há mais de {random.randint(5, 20)} anos.',
                    'has_organic_certification': random.choice([True, True, True, False]),  # 75% certified
                    'certification_details': 'IBD - Instituto Biodinâmico' if random.random() > 0.5 else 'Orgânico Brasil',
                    'whatsapp': f'11 9{random.randint(1000, 9999)}-{random.randint(1000, 9999)}',
                    'instagram': f'@{(producer_names[i] if i < len(producer_names) else f"produtor{i}").lower().replace(" ", "").replace("ã", "a").replace("é", "e")}',
                    'is_verified': random.choice([True, True, False]),  # 66% verified
                }
            )
            
            business_name = profile.business_name
            
            if user_created and profile_created:
                self.stdout.write(f'  ✓ {business_name} ({email})')
                created_count += 1
            else:
                self.stdout.write(f'  ℹ {business_name} já existe - adicionando localizações')
            
            # Create 2-3 locations for each producer (even if they already exist)
            num_locations = random.randint(2, 3)
            for j in range(num_locations):
                neighborhood = random.choice(neighborhoods)
                location_type = random.choice(location_types)
                
                # Generate location name based on type
                if location_type == 'FAIR':
                    location_name = f'Feira Orgânica {neighborhood["name"]}'
                elif location_type == 'STORE':
                    location_name = f'Loja {business_name}'
                else:
                    location_name = f'Delivery {business_name}'
                
                # Create address with slight random variation
                lat_variation = Decimal(str(random.uniform(-0.01, 0.01)))
                lng_variation = Decimal(str(random.uniform(-0.01, 0.01)))
                
                address = Address.objects.create(
                    street=f'{neighborhood["street_prefix"]} {random.choice(street_names)}',
                    number=str(random.randint(10, 9999)),
                    complement=random.choice(['', '', '', 'Loja 1', 'Box 12', 'Barraca 5']),
                    neighborhood=neighborhood['name'],
                    city='São Paulo',
                    state='SP',
                    zip_code=f'{random.randint(10000, 99999):05d}-{random.randint(100, 999):03d}',
                    latitude=Decimal(str(neighborhood['lat'])) + lat_variation,
                    longitude=Decimal(str(neighborhood['lng'])) + lng_variation,
                )
                
                # Create location
                description_options = [
                    "Produtos frescos colhidos na hora!",
                    "Venha conhecer nossa variedade de orgânicos.",
                    "A melhor qualidade em produtos naturais.",
                    "Direto do produtor para sua mesa.",
                ]
                
                location = Location.objects.create(
                    producer=profile,
                    name=location_name,
                    location_type=location_type,
                    description=f'{location_name}. {random.choice(description_options)}',
                    address=address,
                    operation_days=random.choice(operation_days_options),
                    operation_hours=random.choice(operation_hours_options),
                    phone=profile.user.phone,
                    whatsapp=profile.whatsapp,
                    is_verified=profile.is_verified,
                )
                
                # Add 3-8 random products to this location
                num_products = random.randint(3, 8)
                location_products = random.sample(products, min(num_products, len(products)))
                location.products.set(location_products)
                
                locations_created += 1
                
                product_list = ', '.join([p.name for p in location_products[:3]])
                if len(location_products) > 3:
                    product_list += f' +{len(location_products) - 3} outros'
                
                self.stdout.write(f'    ↳ {location_name} ({location.get_location_type_display()})')
                self.stdout.write(f'      {address.neighborhood} - Produtos: {product_list}')
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ {created_count} produtores novos criados!'))
        self.stdout.write(self.style.SUCCESS(f'✅ {locations_created} localizações criadas!'))
        self.stdout.write(self.style.SUCCESS(f'✅ Total geral: {ProducerProfile.objects.count()} produtores e {Location.objects.count()} localizações no banco'))
